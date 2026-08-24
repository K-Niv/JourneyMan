/**
 * server/src/domain/validation.js
 * ================================
 * Input validation for guess submissions.
 *
 * Pure functions — no DB access, no framework dependencies.
 * Throws ValidationError (statusCode 400) on any invalid input so that
 * Express controllers can catch and forward the right HTTP response.
 */

/**
 * Lightweight error class for validation failures.
 * Carries a `statusCode` so controllers can respond without extra logic.
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Validate that a guess submission is structurally correct before grading.
 *
 * Rules:
 *  1. `guess` must be an array.
 *  2. `guess` must have exactly `stintCount` elements.
 *  3. Every element must be a non-empty string.
 *
 * @param {unknown} guess      - The raw value submitted by the client.
 * @param {number}  stintCount - The number of career stints in today's puzzle.
 * @throws {ValidationError}   - With a descriptive message if validation fails.
 */
export function validateGuess(guess, stintCount) {
  if (!Array.isArray(guess)) {
    throw new ValidationError('Guess must be an array of team IDs.');
  }

  if (guess.length !== stintCount) {
    throw new ValidationError(
      `Guess must contain exactly ${stintCount} team ID${stintCount === 1 ? '' : 's'} ` +
      `(received ${guess.length}).`
    );
  }

  for (let i = 0; i < guess.length; i++) {
    if (typeof guess[i] !== 'string' || guess[i].trim() === '') {
      throw new ValidationError(
        `Each guess entry must be a non-empty string. ` +
        `Invalid value at index ${i}: ${JSON.stringify(guess[i])}`
      );
    }
  }
}
