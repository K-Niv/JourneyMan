/**
 * server/src/services/puzzleService.js
 * =====================================
 * Business-logic orchestration for puzzle-related API endpoints.
 *
 * Responsibilities:
 *  - Fetch today's DailyPuzzle from the DB (by UTC date)
 *  - Build the sanitised public payload (no answer leakage)
 *  - Persist guess attempts and DailyResult records
 *  - Enforce attempt limits and game-over state
 *
 * All DB access goes through the shared Prisma singleton.
 * All grading is delegated to the pure domain layer.
 */

import prisma from '../lib/prisma.js';
import { gradeGuess, isWin } from '../domain/grading.js';
import { validateGuess } from '../domain/validation.js';
import { getCache, setCache } from '../lib/redis.js';

// ---------------------------------------------------------------------------
// Helpers & Constants
// ---------------------------------------------------------------------------

const BASE_PUZZLE_CACHE_TTL = 48 * 3600; // 48 hours in seconds

/**
 * Return today's date as a UTC "YYYY-MM-DD" string.
 * This is what the `date` column (type Date) is keyed on.
 */
export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Find or create a User row for an anonymous session.
 * Called only when a guess is submitted with an X-Anonymous-Id header.
 *
 * @param {string} anonymousId
 * @returns {Promise<import('@prisma/client').User>}
 */
async function findOrCreateAnonymousUser(anonymousId) {
  return prisma.user.upsert({
    where: { anonymousId },
    update: {},
    create: { anonymousId },
  });
}

// ---------------------------------------------------------------------------
// fetchBaseDailyPuzzle & warmDailyPuzzleCache
// ---------------------------------------------------------------------------

/**
 * Fetch the base puzzle definition for a specific UTC date.
 * Checks Redis cache first; queries PostgreSQL and populates cache on miss.
 *
 * @param {string} [dateStr=todayUTC()]
 * @returns {Promise<object|null>}
 */
export async function fetchBaseDailyPuzzle(dateStr = todayUTC()) {
  const cacheKey = `puzzle:daily:${dateStr}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const [puzzle, allTeams] = await Promise.all([
    prisma.dailyPuzzle.findUnique({
      where: { date: new Date(dateStr) },
      include: {
        player: {
          include: {
            careerStints: {
              orderBy: { stintOrder: 'asc' },
              include: { team: true },
            },
          },
        },
      },
    }),
    prisma.team.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!puzzle) {
    return null;
  }

  const { player } = puzzle;
  const stints = player.careerStints;

  // Use all teams if available; fallback to stint teams if query returned none (e.g., test mocks)
  const teamsSource = allTeams && allTeams.length > 0
    ? allTeams
    : stints.map((s) => s.team);

  const seen = new Set();
  const availableTeams = [];
  for (const team of teamsSource) {
    if (!seen.has(team.id)) {
      seen.add(team.id);
      availableTeams.push({
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        logoUrl: team.logoUrl ?? null,
      });
    }
  }

  const stintsData = stints.map((s) => ({
    stintOrder: s.stintOrder,
    teamId: s.team.id,
    teamName: s.team.name,
    abbreviation: s.team.abbreviation,
    startYear: s.startYear,
    endYear: s.endYear,
  }));

  const basePayload = {
    puzzleId: puzzle.id,
    puzzleNumber: puzzle.puzzleNumber,
    date: dateStr,
    difficulty: puzzle.difficulty,
    maxAttempts: puzzle.maxAttempts,
    player: {
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      imageUrl: player.imageUrl ?? null,
    },
    stintCount: stints.length,
    availableTeams,
    stints: stintsData,
  };

  await setCache(cacheKey, basePayload, BASE_PUZZLE_CACHE_TTL);
  return basePayload;
}

/**
 * Pre-warm the cache for a given UTC date.
 * Used by server startup and the UTC midnight cron job.
 *
 * @param {string} [dateStr=todayUTC()]
 * @returns {Promise<object|null>}
 */
export async function warmDailyPuzzleCache(dateStr = todayUTC()) {
  const base = await fetchBaseDailyPuzzle(dateStr);
  if (base) {
    console.log(`⚡ [CACHE WARMER] Successfully cached puzzle #${base.puzzleNumber} for ${dateStr}.`);
  }
  return base;
}

// ---------------------------------------------------------------------------
// getTodaysPuzzle
// ---------------------------------------------------------------------------

/**
 * Fetch the puzzle for today (UTC date) and return the sanitised public DTO.
 *
 * The answer (ordered team IDs) is NEVER returned here unless game over.
 * `availableTeams` is the full de-duplicated list of teams — client uses it to populate the team selector.
 *
 * @param {string|null} [anonymousId=null]
 * @param {string|null} [authenticatedUserId=null]
 * @returns {Promise<object>} Public puzzle payload
 * @throws  If no puzzle is scheduled for today
 */
export async function getTodaysPuzzle(anonymousId = null, authenticatedUserId = null) {
  const today = todayUTC();
  const base = await fetchBaseDailyPuzzle(today);

  if (!base) {
    const err = new Error(`No puzzle scheduled for ${today}.`);
    err.statusCode = 404;
    throw err;
  }

  // Resolve user identity to check for existing progress
  let userId = authenticatedUserId;
  if (!userId && anonymousId) {
    const anon = await prisma.user.findUnique({ where: { anonymousId } });
    if (anon) {
      userId = anon.id;
    }
  }

  let userResult = null;
  if (userId) {
    const result = await prisma.dailyResult.findUnique({
      where: { userId_puzzleId: { userId, puzzleId: base.puzzleId } },
    });

    if (result) {
      const won = result.won;
      const attempts = result.attempts;
      const gameOver = won || attempts >= base.maxAttempts;

      userResult = {
        won,
        gameOver,
        attempts,
        guesses: result.guesses,
        feedback: result.feedback,
      };

      if (gameOver) {
        userResult.answer = base.stints;
      }
    }
  }

  const payload = {
    puzzleId: base.puzzleId,
    puzzleNumber: base.puzzleNumber,
    date: base.date,
    difficulty: base.difficulty,
    maxAttempts: base.maxAttempts,
    player: base.player,
    stintCount: base.stintCount,
    availableTeams: base.availableTeams,
  };

  if (userResult) {
    payload.userResult = userResult;
  }

  return payload;
}

// ---------------------------------------------------------------------------
// submitGuess
// ---------------------------------------------------------------------------

/**
 * Validate and grade a guess submission.
 *
 * Flow:
 *  1. Load today's puzzle + career stints (answer)
 *  2. Validate shape of submitted guess
 *  3. Load or create DailyResult for this user + puzzle
 *  4. Enforce max-attempts and already-completed guards
 *  5. Grade the guess
 *  6. Persist the updated DailyResult
 *  7. Return graded response (answer only revealed when gameOver = true)
 *
 * @param {string[]}      guess        - Array of team IDs submitted by the client
 * @param {string | null} anonymousId  - Value from X-Anonymous-Id header (or null)
 * @param {string | null} [authenticatedUserId=null] - Authenticated user ID (or null)
 * @returns {Promise<object>}          - Graded response payload
 */
export async function submitGuess(guess, anonymousId, authenticatedUserId = null) {
  const today = todayUTC();

  // 1. Load puzzle + ordered stints (the answer)
  const base = await fetchBaseDailyPuzzle(today);

  if (!base) {
    const err = new Error(`No puzzle scheduled for ${today}.`);
    err.statusCode = 404;
    throw err;
  }

  const answer = base.stints.map((s) => s.teamId);

  // 2. Validate the submitted guess
  validateGuess(guess, answer.length); // throws ValidationError on bad input

  // 3. Resolve user identity: authenticated userId takes precedence
  let userId = authenticatedUserId;
  if (!userId && anonymousId) {
    const user = await findOrCreateAnonymousUser(anonymousId);
    userId = user.id;
  }

  // 4. Load existing DailyResult (if any)
  let result = userId
    ? await prisma.dailyResult.findUnique({
        where: { userId_puzzleId: { userId, puzzleId: base.puzzleId } },
      })
    : null;

  const previousGuesses = result ? result.guesses : [];
  const previousFeedback = result ? result.feedback : [];

  // Guard: game already won
  if (result && result.won) {
    const err = new Error('This puzzle is already completed for today.');
    err.statusCode = 409;
    throw err;
  }

  // Guard: attempt limit exhausted
  if (previousGuesses.length >= base.maxAttempts) {
    const err = new Error(`Maximum attempts (${base.maxAttempts}) reached.`);
    err.statusCode = 409;
    throw err;
  }

  // 5. Grade the guess
  const feedback = gradeGuess(guess, answer);
  const won = isWin(feedback);

  const updatedGuesses = [...previousGuesses, guess];
  const updatedFeedback = [...previousFeedback, feedback];
  const attemptNumber = updatedGuesses.length;
  const gameOver = won || attemptNumber >= base.maxAttempts;

  // 6. Persist (only if we have a userId)
  if (userId) {
    if (result) {
      await prisma.dailyResult.update({
        where: { userId_puzzleId: { userId, puzzleId: base.puzzleId } },
        data: {
          won,
          attempts: attemptNumber,
          guesses: updatedGuesses,
          feedback: updatedFeedback,
        },
      });
    } else {
      await prisma.dailyResult.create({
        data: {
          userId,
          puzzleId: base.puzzleId,
          won,
          attempts: attemptNumber,
          guesses: updatedGuesses,
          feedback: updatedFeedback,
        },
      });
    }
  }

  // 7. Build response — answer only when game is over
  const response = {
    puzzleId: base.puzzleId,
    attemptNumber,
    maxAttempts: base.maxAttempts,
    guess,
    feedback,
    won,
    gameOver,
  };

  if (gameOver) {
    response.answer = base.stints;
  }

  return response;
}
