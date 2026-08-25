/**
 * server/src/controllers/puzzleController.js
 * ============================================
 * Express request/response handlers for puzzle endpoints.
 *
 * Each controller method:
 *  1. Extracts request data
 *  2. Delegates to the service layer
 *  3. Sends an appropriate HTTP response
 *  4. Catches known error types and returns structured error responses
 *
 * Error handling strategy:
 *  - ValidationError (statusCode 400)  → 400 Bad Request
 *  - 404 errors                        → 404 Not Found
 *  - 409 errors                        → 409 Conflict
 *  - Everything else                   → 500 Internal Server Error
 */

import { getTodaysPuzzle, submitGuess } from '../services/puzzleService.js';
import { ValidationError } from '../domain/validation.js';

// ---------------------------------------------------------------------------
// GET /api/puzzle/today
// ---------------------------------------------------------------------------

/**
 * Return today's puzzle (player, difficulty, available teams — no answer).
 *
 * @type {import('express').RequestHandler}
 */
export async function getToday(req, res) {
  try {
    const payload = await getTodaysPuzzle();
    return res.status(200).json(payload);
  } catch (err) {
    const status = err.statusCode ?? 500;
    return res.status(status).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// POST /api/puzzle/guess
// ---------------------------------------------------------------------------

/**
 * Accept a guess submission, grade it, and return feedback.
 *
 * Request body: { guess: string[] }
 * Header (optional): X-Anonymous-Id
 *
 * @type {import('express').RequestHandler}
 */
export async function postGuess(req, res) {
  const { guess } = req.body ?? {};
  const anonymousId = req.anonymousId ?? null;

  try {
    const payload = await submitGuess(guess, anonymousId);
    return res.status(200).json(payload);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    const status = err.statusCode ?? 500;
    return res.status(status).json({ error: err.message });
  }
}
