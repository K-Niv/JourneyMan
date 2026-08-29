/**
 * server/src/services/historyService.js
 * ======================================
 * Business logic for user play history, calendar queries, and aggregate statistics.
 *
 * Responsibilities:
 *  - Fetch user puzzle results for a specific calendar month
 *  - Compute aggregate user statistics (games played, win rate, average attempts)
 *  - Compute streak metrics (current streak, max streak) adhering to daily continuity rules
 *  - Build attempt distribution breakdown (1-6 attempts + fail)
 */

import prisma from '../lib/prisma.js';

/**
 * Return today's date as a UTC "YYYY-MM-DD" string.
 */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculate difference in whole calendar days between two "YYYY-MM-DD" strings (d1 - d2).
 *
 * @param {string} dateStr1
 * @param {string} dateStr2
 * @returns {number} Difference in days
 */
function diffInDays(dateStr1, dateStr2) {
  const d1 = new Date(`${dateStr1}T00:00:00Z`);
  const d2 = new Date(`${dateStr2}T00:00:00Z`);
  const diffTime = d1.getTime() - d2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Fetch calendar results for a user for a given month and year.
 *
 * @param {string} userId
 * @param {number|string} [year]  - 4-digit year (defaults to current UTC year)
 * @param {number|string} [month] - 1-based month 1-12 (defaults to current UTC month)
 * @returns {Promise<Array<object>>}
 */
export async function getUserHistory(userId, year, month) {
  if (!userId) {
    const err = new Error('User ID is required.');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const parsedYear = year ? parseInt(year, 10) : now.getUTCFullYear();
  const parsedMonth = month ? parseInt(month, 10) : now.getUTCMonth() + 1;

  if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
    const err = new Error('Invalid year parameter.');
    err.statusCode = 400;
    throw err;
  }

  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    const err = new Error('Invalid month parameter (must be 1-12).');
    err.statusCode = 400;
    throw err;
  }

  // Month range in UTC
  const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
  const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 1));

  const results = await prisma.dailyResult.findMany({
    where: {
      userId,
      puzzle: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    },
    include: {
      puzzle: {
        include: {
          player: true,
        },
      },
    },
    orderBy: {
      puzzle: {
        date: 'asc',
      },
    },
  });

  return results.map((r) => {
    const dateStr = r.puzzle.date instanceof Date
      ? r.puzzle.date.toISOString().slice(0, 10)
      : String(r.puzzle.date).slice(0, 10);

    return {
      id: r.id,
      puzzleId: r.puzzleId,
      date: dateStr,
      puzzleNumber: r.puzzle.puzzleNumber,
      difficulty: r.puzzle.difficulty,
      playerName: `${r.puzzle.player.firstName} ${r.puzzle.player.lastName}`,
      won: r.won,
      attempts: r.attempts,
      maxAttempts: r.puzzle.maxAttempts,
      completedAt: r.completedAt,
    };
  });
}

/**
 * Compute aggregate statistics and streak data for a user.
 *
 * @param {string} userId
 * @returns {Promise<object>} User statistics payload
 */
export async function getUserStats(userId) {
  if (!userId) {
    const err = new Error('User ID is required.');
    err.statusCode = 400;
    throw err;
  }

  const results = await prisma.dailyResult.findMany({
    where: { userId },
    include: {
      puzzle: {
        select: {
          date: true,
          puzzleNumber: true,
          difficulty: true,
          maxAttempts: true,
        },
      },
    },
    orderBy: {
      puzzle: {
        date: 'asc',
      },
    },
  });

  const gamesPlayed = results.length;
  const wonResults = results.filter((r) => r.won);
  const gamesWon = wonResults.length;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  // Attempt distribution
  const attemptDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    fail: 0,
  };

  for (const r of results) {
    if (r.won && r.attempts >= 1 && r.attempts <= 6) {
      attemptDistribution[r.attempts] = (attemptDistribution[r.attempts] || 0) + 1;
    } else {
      attemptDistribution.fail = (attemptDistribution.fail || 0) + 1;
    }
  }

  // Average attempts on won games
  const averageAttempts = wonResults.length > 0
    ? Number((wonResults.reduce((sum, r) => sum + r.attempts, 0) / wonResults.length).toFixed(1))
    : 0;

  // Streak calculations
  let maxStreak = 0;
  let runningStreak = 0;
  let prevDateStr = null;

  for (const r of results) {
    const dateStr = r.puzzle.date instanceof Date
      ? r.puzzle.date.toISOString().slice(0, 10)
      : String(r.puzzle.date).slice(0, 10);

    if (r.won) {
      if (!prevDateStr) {
        runningStreak = 1;
      } else {
        const dayDiff = diffInDays(dateStr, prevDateStr);
        if (dayDiff === 1) {
          runningStreak += 1;
        } else {
          runningStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, runningStreak);
    } else {
      runningStreak = 0;
    }

    prevDateStr = dateStr;
  }

  // Current streak (evaluating from most recent backwards)
  let currentStreak = 0;
  if (results.length > 0) {
    const today = todayUTC();
    const sortedDesc = [...results].reverse();
    const mostRecent = sortedDesc[0];
    const mostRecentDateStr = mostRecent.puzzle.date instanceof Date
      ? mostRecent.puzzle.date.toISOString().slice(0, 10)
      : String(mostRecent.puzzle.date).slice(0, 10);

    const daysSinceMostRecent = diffInDays(today, mostRecentDateStr);

    // Current streak is active if the most recent game was played today or yesterday and won
    if (daysSinceMostRecent <= 1 && mostRecent.won) {
      currentStreak = 1;
      let currDate = mostRecentDateStr;

      for (let i = 1; i < sortedDesc.length; i++) {
        const item = sortedDesc[i];
        const prevDate = item.puzzle.date instanceof Date
          ? item.puzzle.date.toISOString().slice(0, 10)
          : String(item.puzzle.date).slice(0, 10);

        const diff = diffInDays(currDate, prevDate);
        if (diff === 1 && item.won) {
          currentStreak += 1;
          currDate = prevDate;
        } else {
          break;
        }
      }
    }
  }

  return {
    gamesPlayed,
    gamesWon,
    winRate,
    currentStreak,
    maxStreak,
    averageAttempts,
    attemptDistribution,
  };
}
