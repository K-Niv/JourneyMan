/**
 * server/src/routes/auth.js
 * =========================
 * Express router for all /api/auth endpoints.
 *
 * Routes:
 *   POST /api/auth/register — create new account (public)
 *   POST /api/auth/login    — log in and receive JWT (public)
 *   POST /api/auth/link     — link anonymous history to account (requires auth)
 *   GET  /api/auth/me       — retrieve current user profile (requires auth)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  login,
  getMe,
  linkAccount,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/link', authLimiter, requireAuth, linkAccount);
router.get('/me', requireAuth, getMe);

export default router;
