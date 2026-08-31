/**
 * server/src/jobs/cronWorker.js
 * ==============================
 * Scheduled background worker for proactive cache warming.
 *
 * Responsibilities:
 *  - On server startup: Warm today's and tomorrow's daily puzzles into Redis.
 *  - Daily at UTC midnight (0 0 * * *): Pre-warm the newly active daily puzzle.
 *
 * This eliminates all cold-start database latency for incoming users.
 */

import cron from 'node-cron';
import { warmDailyPuzzleCache, todayUTC } from '../services/puzzleService.js';
import { config } from '../config/env.js';

/**
 * Return tomorrow's date as a UTC "YYYY-MM-DD" string.
 * @returns {string}
 */
export function tomorrowUTC() {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

/**
 * Initialize proactive cache warming cron jobs and startup warming.
 */
export async function initCronJobs() {
  if (config.isTest) {
    // Do not run background cron jobs during test execution
    return;
  }

  // 1. Startup cache warming (today + tomorrow)
  const today = todayUTC();
  const tomorrow = tomorrowUTC();

  console.log(`🔥 [CACHE WARMER] Priming daily puzzle cache for ${today} and ${tomorrow}...`);

  try {
    await Promise.allSettled([
      warmDailyPuzzleCache(today),
      warmDailyPuzzleCache(tomorrow),
    ]);
    console.log('✅ [CACHE WARMER] Startup cache warming complete.');
  } catch (err) {
    console.warn('⚠️ [CACHE WARMER] Startup cache warming encountered an error:', err.message);
  }

  // 2. Schedule daily rollover at 00:00:00 UTC
  // Cron syntax: minute (0) hour (0) day-of-month (*) month (*) day-of-week (*)
  cron.schedule(
    '0 0 * * *',
    async () => {
      const currentToday = todayUTC();
      const currentTomorrow = tomorrowUTC();
      console.log(`⏰ [CRON] UTC Midnight rollover detected. Warming cache for ${currentToday} and ${currentTomorrow}...`);

      try {
        await Promise.allSettled([
          warmDailyPuzzleCache(currentToday),
          warmDailyPuzzleCache(currentTomorrow),
        ]);
        console.log(`✅ [CRON] Daily puzzle cache successfully refreshed for ${currentToday}.`);
      } catch (err) {
        console.error('❌ [CRON] Error during scheduled cache warming:', err);
      }
    },
    {
      timezone: 'UTC',
    }
  );

  console.log('🕒 [CRON] Proactive daily cache warming scheduled at 00:00:00 UTC.');
}

export default {
  initCronJobs,
};
