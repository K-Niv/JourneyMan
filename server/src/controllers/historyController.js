/**
 * server/src/controllers/historyController.js
 * ============================================
 * Express request/response handlers for user history and stats endpoints.
 *
 * Routes handled:
 *  - GET /api/history        → getHistory
 *  - GET /api/history/stats  → getStats
 */

import { getUserHistory, getUserStats } from '../services/historyService.js';

/**
 * Fetch calendar results for the authenticated user.
 * Optional query params: year (e.g. 2026), month (1-12).
 *
 * @type {import('express').RequestHandler}
 */
export async function getHistory(req, res) {
  const userId = req.userId;
  const { year, month } = req.query;

  try {
    const history = await getUserHistory(userId, year, month);
    return res.status(200).json({ history });
  } catch (err) {
    const status = err.statusCode ?? 500;
    const message = status < 500 ? err.message : 'Internal server error.';
    return res.status(status).json({ error: message });
  }
}

/**
 * Fetch aggregate statistics and streak data for the authenticated user.
 *
 * @type {import('express').RequestHandler}
 */
export async function getStats(req, res) {
  const userId = req.userId;

  try {
    const stats = await getUserStats(userId);
    return res.status(200).json({ stats });
  } catch (err) {
    const status = err.statusCode ?? 500;
    const message = status < 500 ? err.message : 'Internal server error.';
    return res.status(status).json({ error: message });
  }
}
