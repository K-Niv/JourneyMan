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

import { useState, useEffect } from 'react';
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
 * Hook that loads (or rehydrates) today's puzzle and validates auth session on mount.
 * Coordinates both network requests so consumers know when both operations complete.
 *
 * @returns {{ isLoading: boolean, isPuzzleLoading: boolean, isAuthLoading: boolean, error: string|null }}
 */
export function usePuzzleLoader() {
  const isGameLoading = useGameStore((s) => s.isLoading);
  const error = useGameStore((s) => s.error);
  const puzzleDate = useGameStore((s) => s.puzzleDate);
  const puzzleId = useGameStore((s) => s.puzzleId);
  const resetGame = useGameStore((s) => s.resetGame);
  const loadPuzzle = useGameStore((s) => s.loadPuzzle);
  const isProfileLoading = useAuthStore((s) => s.isProfileLoading);
  const ensureAnonymousId = useAuthStore((s) => s.ensureAnonymousId);
  const loadProfile = useAuthStore((s) => s.loadProfile);

  // Synchronous initial loading tracking to prevent 1-frame unrendered flash on cold mount
  const [isInitialAuthLoading, setIsInitialAuthLoading] = useState(true);
  const [isInitialPuzzleLoading, setIsInitialPuzzleLoading] = useState(() => {
    const today = todayUTC();
    const state = useGameStore.getState();
    const isStale = state.puzzleDate !== today;
    const isEmpty = !state.puzzleId;
    const hasIncompleteTeams = !state.availableTeams || state.availableTeams.length < 30;
    return isStale || isEmpty || hasIncompleteTeams;
  });

  useEffect(() => {
    let isMounted = true;

    // Step 1: Ensure anonymous identity exists & validate authenticated token
    ensureAnonymousId();
    Promise.resolve(loadProfile()).finally(() => {
      if (isMounted) {
        setIsInitialAuthLoading(false);
      }
    });

    // Step 2: Check date staleness and load puzzle if needed
    const today = todayUTC();
    const availableTeams = useGameStore.getState().availableTeams;
    const isStale = puzzleDate !== today;
    const isEmpty = !puzzleId;
    const hasIncompleteTeams = !availableTeams || availableTeams.length < 30;

    let puzzlePromise = Promise.resolve();
    if (isStale || isEmpty) {
      // Date changed or no puzzle loaded — reset and fetch fresh data
      resetGame();
      puzzlePromise = Promise.resolve(loadPuzzle());
    } else if (hasIncompleteTeams) {
      // Refresh puzzle data to get all 30 teams without losing current game progress
      puzzlePromise = Promise.resolve(loadPuzzle());
    }

    puzzlePromise.finally(() => {
      if (isMounted) {
        setIsInitialPuzzleLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPuzzleLoading = isGameLoading || isInitialPuzzleLoading;
  const isAuthLoading = isProfileLoading || isInitialAuthLoading;
  const isLoading = isPuzzleLoading || isAuthLoading;

  return {
    isLoading,
    isPuzzleLoading,
    isAuthLoading,
    error,
  };
}
