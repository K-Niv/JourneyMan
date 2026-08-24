/**
 * server/src/domain/grading.js
 * =============================
 * Pure, framework-independent grading engine for JourneyMan.
 *
 * Uses the standard two-pass Wordle algorithm adapted for NBA team IDs.
 * Handles duplicate teams correctly — a team in the guess can only "consume"
 * one matching slot in the answer per occurrence.
 *
 * No imports. No side effects. Fully unit-testable.
 */

import { FEEDBACK } from 'shared';

/**
 * Grade a single guess against the correct answer.
 *
 * @param {string[]} guess  - Array of team IDs the user submitted.
 * @param {string[]} answer - Array of team IDs representing the correct career stints.
 * @returns {string[]}      - Parallel array of feedback values:
 *                            'correct' | 'misplaced' | 'incorrect'
 * @throws {Error}          - If guess and answer lengths differ.
 */
export function gradeGuess(guess, answer) {
  const n = answer.length;

  if (guess.length !== n) {
    throw new Error(
      `Guess length ${guess.length} does not match answer length ${n}`
    );
  }

  const feedback = new Array(n).fill(null);
  // Tracks which answer slots have already been "claimed" by a correct or misplaced match
  const answerUsed = new Array(n).fill(false);

  // -------------------------------------------------------------------
  // Pass 1: Exact matches (correct position)
  // Must be done first so that correct matches take priority over misplaced
  // when a team appears multiple times.
  // -------------------------------------------------------------------
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) {
      feedback[i] = FEEDBACK.CORRECT;
      answerUsed[i] = true;
    }
  }

  // -------------------------------------------------------------------
  // Pass 2: Misplaced or incorrect
  // Only runs for slots not resolved in pass 1.
  // -------------------------------------------------------------------
  for (let i = 0; i < n; i++) {
    if (feedback[i] !== null) continue; // already resolved as CORRECT

    let matched = false;
    for (let j = 0; j < n; j++) {
      if (!answerUsed[j] && guess[i] === answer[j]) {
        feedback[i] = FEEDBACK.MISPLACED;
        answerUsed[j] = true; // consume this answer slot
        matched = true;
        break;
      }
    }

    if (!matched) {
      feedback[i] = FEEDBACK.INCORRECT;
    }
  }

  return feedback;
}

export function isWin(feedback) {
  if (!Array.isArray(feedback) || feedback.length === 0) {
    return false;
  }
  for (let i = 0; i < feedback.length; i++) {
    if (feedback[i] !== FEEDBACK.CORRECT) {
      return false;
    }
  }
  return true;
}
