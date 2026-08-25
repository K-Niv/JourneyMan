/**
 * client/src/stores/gameStore.js
 * ===============================
 * Zustand store managing the core game-loop state.
 *
 * Persisted to localStorage via Zustand's `persist` middleware so
 * in-progress games survive page refresh. On a new UTC day the
 * `usePuzzleLoader` hook detects the stale date and calls `resetGame()`
 * before `loadPuzzle()`.
 *
 * State is divided into three groups:
 *  1. Puzzle metadata  — populated from GET /api/puzzle/today
 *  2. Game-play state  — guesses, feedback, status (updated on each guess)
 *  3. Transient UI     — isLoading, error (excluded from persistence)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchTodaysPuzzle, submitGuessToApi } from '../services/api.js';
import { MAX_ATTEMPTS } from 'shared';

// ---------------------------------------------------------------------------
// Initial state (also used by resetGame)
// ---------------------------------------------------------------------------

const initialGameState = {
  // Puzzle metadata (from API)
  puzzleId: null,
  puzzleNumber: null,
  puzzleDate: null, // "YYYY-MM-DD" UTC string
  difficulty: null,
  maxAttempts: MAX_ATTEMPTS,
  player: null, // { id, name, imageUrl }
  stintCount: 0,
  availableTeams: [], // [{ id, name, abbreviation, logoUrl }]

  // Game-play state
  currentGuess: [], // team IDs for the in-progress row
  guesses: [], // Array of past guess arrays
  feedback: [], // Array of past feedback arrays (parallel to guesses)
  gameStatus: 'idle', // 'idle' | 'playing' | 'won' | 'lost'
  answer: null, // Revealed only on game over (from API)

  // Transient UI state (excluded from persistence)
  isLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create(
  persist(
    (set, get) => ({
      ...initialGameState,

      // ---------------------------------------------------------------------
      // loadPuzzle — fetch today's puzzle from the API
      // ---------------------------------------------------------------------

      /**
       * Fetch today's puzzle and populate the store.
       * Sets gameStatus to 'playing' on success.
       * No-ops if already loading.
       */
      loadPuzzle: async () => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const data = await fetchTodaysPuzzle();

          set({
            puzzleId: data.puzzleId,
            puzzleNumber: data.puzzleNumber,
            puzzleDate: data.date,
            difficulty: data.difficulty,
            maxAttempts: data.maxAttempts,
            player: data.player,
            stintCount: data.stintCount,
            availableTeams: data.availableTeams,
            // Initialise empty guess slots matching stint count
            currentGuess: new Array(data.stintCount).fill(null),
            gameStatus: 'playing',
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err.message ?? 'Failed to load puzzle.',
          });
        }
      },

      // ---------------------------------------------------------------------
      // Guess slot manipulation
      // ---------------------------------------------------------------------

      /**
       * Set a team ID in a specific slot of the current guess.
       *
       * @param {number} index  - 0-based slot index
       * @param {string} teamId - Team UUID to place
       */
      setSlot: (index, teamId) => {
        const { currentGuess, stintCount } = get();
        if (index < 0 || index >= stintCount) return;

        const updated = [...currentGuess];
        updated[index] = teamId;
        set({ currentGuess: updated });
      },

      /**
       * Clear a specific slot in the current guess.
       *
       * @param {number} index - 0-based slot index
       */
      clearSlot: (index) => {
        const { currentGuess, stintCount } = get();
        if (index < 0 || index >= stintCount) return;

        const updated = [...currentGuess];
        updated[index] = null;
        set({ currentGuess: updated });
      },

      /**
       * Reset all slots in the current guess to null.
       */
      clearCurrentGuess: () => {
        const { stintCount } = get();
        set({ currentGuess: new Array(stintCount).fill(null) });
      },

      // ---------------------------------------------------------------------
      // submitGuess — grade the current guess via the API
      // ---------------------------------------------------------------------

      /**
       * Submit the current guess to the API for grading.
       *
       * Validates that every slot is filled before sending.
       * On success, appends the guess + feedback and updates game status.
       * The answer is revealed only when the API signals gameOver.
       */
      submitGuess: async () => {
        const { currentGuess, stintCount, isLoading, gameStatus } = get();

        // Guards
        if (isLoading) return;
        if (gameStatus !== 'playing') return;
        if (currentGuess.length !== stintCount || currentGuess.some((t) => !t)) {
          set({ error: 'Please fill all slots before submitting.' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const data = await submitGuessToApi(currentGuess);

          const updatedGuesses = [...get().guesses, data.guess];
          const updatedFeedback = [...get().feedback, data.feedback];

          let newStatus = 'playing';
          if (data.won) {
            newStatus = 'won';
          } else if (data.gameOver) {
            newStatus = 'lost';
          }

          set({
            guesses: updatedGuesses,
            feedback: updatedFeedback,
            gameStatus: newStatus,
            answer: data.answer ?? null,
            // Reset current guess for the next attempt
            currentGuess: data.gameOver
              ? get().currentGuess
              : new Array(stintCount).fill(null),
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err.message ?? 'Failed to submit guess.',
          });
        }
      },

      // ---------------------------------------------------------------------
      // resetGame — clear all game state (used on date change)
      // ---------------------------------------------------------------------

      /**
       * Reset the store to its initial state.
       * Called by usePuzzleLoader when the UTC date has changed.
       */
      resetGame: () => {
        set({ ...initialGameState });
      },
    }),
    {
      name: 'journeyman-game',
      /**
       * Only persist the fields that matter across page refreshes.
       * Exclude transient UI state (isLoading, error) so the app
       * doesn't rehydrate into a broken loading state.
       */
      partialize: (state) => ({
        puzzleId: state.puzzleId,
        puzzleNumber: state.puzzleNumber,
        puzzleDate: state.puzzleDate,
        difficulty: state.difficulty,
        maxAttempts: state.maxAttempts,
        player: state.player,
        stintCount: state.stintCount,
        availableTeams: state.availableTeams,
        currentGuess: state.currentGuess,
        guesses: state.guesses,
        feedback: state.feedback,
        gameStatus: state.gameStatus,
        answer: state.answer,
      }),
    }
  )
);
