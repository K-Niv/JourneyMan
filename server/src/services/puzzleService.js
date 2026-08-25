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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return today's date as a UTC "YYYY-MM-DD" string.
 * This is what the `date` column (type Date) is keyed on.
 */
function todayUTC() {
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
// getTodaysPuzzle
// ---------------------------------------------------------------------------

/**
 * Fetch the puzzle for today (UTC date) and return the sanitised public DTO.
 *
 * The answer (ordered team IDs) is NEVER returned here.
 * `availableTeams` is the full de-duplicated list of teams from the player's
 * career stints — client uses it to populate the team selector.
 *
 * @returns {Promise<object>} Public puzzle payload
 * @throws  If no puzzle is scheduled for today
 */
export async function getTodaysPuzzle() {
  const today = todayUTC();

  const puzzle = await prisma.dailyPuzzle.findUnique({
    where: { date: new Date(today) },
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
  });

  if (!puzzle) {
    const err = new Error(`No puzzle scheduled for ${today}.`);
    err.statusCode = 404;
    throw err;
  }

  const { player } = puzzle;
  const stints = player.careerStints;

  // Build de-duplicated list of available teams (preserves first-seen order)
  const seen = new Set();
  const availableTeams = [];
  for (const stint of stints) {
    if (!seen.has(stint.team.id)) {
      seen.add(stint.team.id);
      availableTeams.push({
        id: stint.team.id,
        name: stint.team.name,
        abbreviation: stint.team.abbreviation,
        logoUrl: stint.team.logoUrl ?? null,
      });
    }
  }

  return {
    puzzleId: puzzle.id,
    puzzleNumber: puzzle.puzzleNumber,
    date: today,
    difficulty: puzzle.difficulty,
    maxAttempts: puzzle.maxAttempts,
    player: {
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      imageUrl: player.imageUrl ?? null,
    },
    stintCount: stints.length,
    availableTeams,
  };
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
 * @returns {Promise<object>}          - Graded response payload
 */
export async function submitGuess(guess, anonymousId) {
  const today = todayUTC();

  // 1. Load puzzle + ordered stints (the answer)
  const puzzle = await prisma.dailyPuzzle.findUnique({
    where: { date: new Date(today) },
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
  });

  if (!puzzle) {
    const err = new Error(`No puzzle scheduled for ${today}.`);
    err.statusCode = 404;
    throw err;
  }

  const answer = puzzle.player.careerStints.map((s) => s.team.id);

  // 2. Validate the submitted guess
  validateGuess(guess, answer.length); // throws ValidationError on bad input

  // 3. Resolve user identity
  let userId = null;
  if (anonymousId) {
    const user = await findOrCreateAnonymousUser(anonymousId);
    userId = user.id;
  }

  // 4. Load existing DailyResult (if any)
  let result = userId
    ? await prisma.dailyResult.findUnique({
        where: { userId_puzzleId: { userId, puzzleId: puzzle.id } },
      })
    : null;

  const previousGuesses = result ? (result.guesses) : [];
  const previousFeedback = result ? (result.feedback) : [];

  // Guard: game already won
  if (result && result.won) {
    const err = new Error('This puzzle is already completed for today.');
    err.statusCode = 409;
    throw err;
  }

  // Guard: attempt limit exhausted
  if (previousGuesses.length >= puzzle.maxAttempts) {
    const err = new Error(`Maximum attempts (${puzzle.maxAttempts}) reached.`);
    err.statusCode = 409;
    throw err;
  }

  // 5. Grade the guess
  const feedback = gradeGuess(guess, answer);
  const won = isWin(feedback);

  const updatedGuesses = [...previousGuesses, guess];
  const updatedFeedback = [...previousFeedback, feedback];
  const attemptNumber = updatedGuesses.length;
  const gameOver = won || attemptNumber >= puzzle.maxAttempts;

  // 6. Persist (only if we have a userId)
  if (userId) {
    if (result) {
      await prisma.dailyResult.update({
        where: { userId_puzzleId: { userId, puzzleId: puzzle.id } },
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
          puzzleId: puzzle.id,
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
    puzzleId: puzzle.id,
    attemptNumber,
    maxAttempts: puzzle.maxAttempts,
    guess,
    feedback,
    won,
    gameOver,
  };

  if (gameOver) {
    response.answer = puzzle.player.careerStints.map((s) => ({
      stintOrder: s.stintOrder,
      teamId: s.team.id,
      teamName: s.team.name,
      abbreviation: s.team.abbreviation,
      startYear: s.startYear,
      endYear: s.endYear,
    }));
  }

  return response;
}
