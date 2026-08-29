/**
 * server/src/middleware/rateLimiter.js
 * =====================================
 * Multi-tier rate limiting policies using express-rate-limit.
 * Protects against brute-force attacks on auth endpoints, abuse on guess submission,
 * and general API flooding while allowing graceful bypass during test suites.
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Standard JSON response handler for rate limit violations.
 */
const rateLimitHandler = (message) => (_req, res) => {
  res.status(429).json({ error: message });
};

/**
 * Global / General API Rate Limiter
 * Default: 300 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.generalWindowMs,
  max: config.rateLimit.generalMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled,
  handler: rateLimitHandler('Too many requests from this IP, please try again later.'),
});

/**
 * Strict Auth Rate Limiter
 * Applied to POST /api/auth/login, POST /api/auth/register, POST /api/auth/link
 * Default: 15 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled,
  handler: rateLimitHandler('Too many authentication attempts. Please try again after 15 minutes.'),
});

/**
 * Guess Submission Rate Limiter
 * Applied to POST /api/puzzle/guess
 * Default: 45 submissions per minute per IP
 */
export const guessLimiter = rateLimit({
  windowMs: config.rateLimit.guessWindowMs,
  max: config.rateLimit.guessMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => !config.rateLimit.enabled,
  handler: rateLimitHandler('Too many guess submissions. Please slow down.'),
});
