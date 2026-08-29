/**
 * server/src/routes/history.js
 * =============================
 * Express router for user history and stats endpoints.
 *
 * Routes:
 *   GET /api/history        — get monthly history for calendar view (requires auth)
 *   GET /api/history/stats  — get aggregate statistics and streaks (requires auth)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getHistory, getStats } from '../controllers/historyController.js';

const router = Router();

// Strict authentication enforcement on all history routes
router.use(requireAuth);

router.get('/', getHistory);
router.get('/stats', getStats);

export default router;
