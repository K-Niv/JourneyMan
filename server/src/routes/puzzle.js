/**
 * server/src/routes/puzzle.js
 * ============================
 * Express router for all /api/puzzle endpoints.
 *
 * Routes:
 *   GET  /api/puzzle/today  — fetch today's puzzle (no auth required)
 *   POST /api/puzzle/guess  — submit a guess (anonymous or authenticated)
 *
 * The `anonymousUser` middleware runs on every puzzle route to parse the
 * optional X-Anonymous-Id header into req.anonymousId. When the header is
 * present, the guess endpoint persists results against that session; when
 * absent, grading still works but nothing is written to the database.
 */

import { Router } from 'express';
import { anonymousUser } from '../middleware/anonymousUser.js';
import { optionalAuth } from '../middleware/auth.js';
import { guessLimiter } from '../middleware/rateLimiter.js';
import { getToday, postGuess } from '../controllers/puzzleController.js';

const router = Router();

// Apply anonymous-user and optional JWT auth resolution to all puzzle routes
router.use(anonymousUser);
router.use(optionalAuth);

router.get('/today', getToday);
router.post('/guess', guessLimiter, postGuess);

export default router;
