/**
 * client/src/hooks/usePuzzleLoader.js
 * =====================================
 * Custom hook that handles daily puzzle loading and UTC date staleness.
 *
 * On mount:
 *  1. Ensures an anonymous session ID exists (authStore)
 *  2. Reads the persisted `puzzleDate` from the game store
 *  3. Computes today's UTC date
 *  4. If dates differ (or no puzzle loaded) → resets and re-fetches
 *  5. If dates match and game is in progress → rehydrated state is used as-is
 *
 * This hook is the single entry point for puzzle initialisation. Components
 * just call `usePuzzleLoader()` and read `isLoading` / `error` from it.
 */

import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useAuthStore } from '../stores/authStore.js';

/**
 * Get today's date as a UTC "YYYY-MM-DD" string.
 * Matches the server's `todayUTC()` helper exactly.
 *
 * @returns {string}
 */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Hook that loads (or rehydrates) today's puzzle on mount.
 *
 * @returns {{ isLoading: boolean, error: string|null }}
 */
export function usePuzzleLoader() {
  const isLoading = useGameStore((s) => s.isLoading);
  const error = useGameStore((s) => s.error);
  const puzzleDate = useGameStore((s) => s.puzzleDate);
  const puzzleId = useGameStore((s) => s.puzzleId);
  const resetGame = useGameStore((s) => s.resetGame);
  const loadPuzzle = useGameStore((s) => s.loadPuzzle);
  const ensureAnonymousId = useAuthStore((s) => s.ensureAnonymousId);

  useEffect(() => {
    // Step 1: Ensure anonymous identity exists
    ensureAnonymousId();

    // Step 2: Check date staleness
    const today = todayUTC();
    const isStale = puzzleDate !== today;
    const isEmpty = !puzzleId;

    if (isStale || isEmpty) {
      // Date changed or no puzzle loaded — reset and fetch fresh data
      resetGame();
      loadPuzzle();
    }
    // If dates match and game is active, the persisted state is already valid.
    // We intentionally do NOT re-fetch in that case.

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Empty dep array: run once on mount. The staleness check is point-in-time.
  // If the user leaves the tab open overnight, they'll get the new puzzle
  // on next page interaction (visibility change could be added in a future PR).

  return { isLoading, error };
}
