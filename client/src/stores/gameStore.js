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
 *  3. Transient UI     — isLoading, isSubmitting, error (excluded from persistence)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchTodaysPuzzle, submitGuessToApi } from '../services/api.js';
import { MAX_ATTEMPTS, FEEDBACK } from 'shared';

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
  isLoading: false, // For initial puzzle fetch
  isSubmitting: false, // For guess submission
  error: null,
  lastSubmittedRowIndex: null, // Tracks row index of the newly submitted guess for animation
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
       * Synchronises with userResult if returned by the server.
       *
       * @param {{ forceSync?: boolean }} [options]
       */
      loadPuzzle: async (options = {}) => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const data = await fetchTodaysPuzzle();
          const state = get();
          const isSamePuzzle = state.puzzleId === data.puzzleId && state.currentGuess?.length === data.stintCount;

          let guesses = isSamePuzzle && !options.forceSync ? state.guesses : [];
          let feedback = isSamePuzzle && !options.forceSync ? state.feedback : [];
          let gameStatus = isSamePuzzle && !options.forceSync ? state.gameStatus : 'playing';
          let answer = isSamePuzzle && !options.forceSync ? state.answer : null;
          let currentGuess = isSamePuzzle && !options.forceSync ? state.currentGuess : new Array(data.stintCount).fill(null);

          // If the server has a saved result for this user/session, synchronise it!
          if (data.userResult) {
            guesses = data.userResult.guesses || [];
            feedback = data.userResult.feedback || [];
            if (data.userResult.won) {
              gameStatus = 'won';
            } else if (data.userResult.gameOver) {
              gameStatus = 'lost';
            } else {
              gameStatus = 'playing';
            }
            answer = data.userResult.answer ?? (gameStatus !== 'playing' ? data.answer ?? null : null);

            // Populate currentGuess for active row
            if (gameStatus === 'playing' && guesses.length > 0) {
              currentGuess = [...guesses[guesses.length - 1]];
            } else if (gameStatus === 'playing') {
              currentGuess = new Array(data.stintCount).fill(null);
            }
          }

          set({
            puzzleId: data.puzzleId,
            puzzleNumber: data.puzzleNumber,
            puzzleDate: data.date,
            difficulty: data.difficulty,
            maxAttempts: data.maxAttempts,
            player: data.player,
            stintCount: data.stintCount,
            availableTeams: data.availableTeams,
            currentGuess,
            guesses,
            feedback,
            gameStatus,
            answer,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          const message = err.name === 'ApiError'
            ? err.message
            : 'Unable to reach the server. Please check your connection and try again.';
          set({
            isLoading: false,
            error: message,
          });
        }
      },

      // ---------------------------------------------------------------------
      // Guess slot manipulation
      // ---------------------------------------------------------------------

      /**
       * Set a team ID in a specific slot of the current guess.
       * Cannot modify slots that were already confirmed correct (locked).
       *
       * @param {number} index  - 0-based slot index
       * @param {string} teamId - Team UUID to place
       */
      setSlot: (index, teamId) => {
        const { currentGuess, stintCount, feedback } = get();
        if (index < 0 || index >= stintCount) return;

        // Prevent modifying locked (green) slots
        const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;
        if (lastFeedback && lastFeedback[index] === FEEDBACK.CORRECT) return;

        const updated = [...currentGuess];
        updated[index] = teamId;
        set({ currentGuess: updated });
      },

      /**
       * Clear a specific slot in the current guess.
       * Cannot clear locked slots.
       *
       * @param {number} index - 0-based slot index
       */
      clearSlot: (index) => {
        const { currentGuess, stintCount, feedback } = get();
        if (index < 0 || index >= stintCount) return;

        const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;
        if (lastFeedback && lastFeedback[index] === FEEDBACK.CORRECT) return;

        const updated = [...currentGuess];
        updated[index] = null;
        set({ currentGuess: updated });
      },

      /**
       * Swap two slots in the current guess (used by drag-and-drop).
       * Neither slot can be locked.
       *
       * @param {number} index1
       * @param {number} index2
       */
      swapSlots: (index1, index2) => {
        const { currentGuess, stintCount, feedback } = get();
        if (index1 < 0 || index1 >= stintCount || index2 < 0 || index2 >= stintCount) return;
        if (index1 === index2) return;

        const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;
        if (lastFeedback) {
          if (lastFeedback[index1] === FEEDBACK.CORRECT || lastFeedback[index2] === FEEDBACK.CORRECT) {
            return;
          }
        }

        const updated = [...currentGuess];
        const temp = updated[index1];
        updated[index1] = updated[index2];
        updated[index2] = temp;
        set({ currentGuess: updated });
      },

      /**
       * Reset unlocked slots in the current guess to null.
       * Preserves locked (green) slots.
       */
      clearCurrentGuess: () => {
        const { stintCount, feedback, currentGuess } = get();
        const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;
        if (lastFeedback) {
          const updated = currentGuess.map((t, idx) =>
            lastFeedback[idx] === FEEDBACK.CORRECT ? t : null
          );
          set({ currentGuess: updated });
        } else {
          set({ currentGuess: new Array(stintCount).fill(null) });
        }
      },

      // ---------------------------------------------------------------------
      // submitGuess — grade the current guess via the API
      // ---------------------------------------------------------------------

      /**
       * Submit the current guess to the API for grading.
       *
       * Validates that every slot is filled before sending.
       * On success, appends the guess + feedback and updates game status.
       * The previous guess is copied down to the next row (green slots locked).
       */
      submitGuess: async () => {
        const { currentGuess, stintCount, isSubmitting, gameStatus } = get();

        // Guards
        if (isSubmitting) return;
        if (gameStatus !== 'playing') return;
        if (currentGuess.length !== stintCount || currentGuess.some((t) => !t)) {
          set({ error: 'Please fill all slots before submitting.' });
          return;
        }

        set({ isSubmitting: true, error: null });

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
            // When game continues, copy down the previous guess to the next row!
            currentGuess: data.gameOver
              ? get().currentGuess
              : [...data.guess],
            isSubmitting: false,
            error: null,
            lastSubmittedRowIndex: updatedGuesses.length - 1,
          });
        } catch (err) {
          const message = err.name === 'ApiError'
            ? err.message
            : 'Unable to reach the server. Please check your connection and try again.';
          set({
            isSubmitting: false,
            error: message,
          });
        }
      },

      /**
       * Clear the animated row pointer once the reveal animation is complete.
       */
      clearLastSubmittedRowIndex: () => {
        set({ lastSubmittedRowIndex: null });
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
       * Exclude transient UI state (isLoading, isSubmitting, error) so the app
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
