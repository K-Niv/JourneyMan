/**
 * server/src/middleware/auth.js
 * ==============================
 * JWT authentication middleware for Express routes.
 *
 * Provides two middleware functions:
 *  1. `requireAuth` — strict enforcement: returns 401 Unauthorized if
 *     the Authorization header is missing, invalid, or expired.
 *  2. `optionalAuth` — permissive: attaches req.userId / req.user if a valid
 *     JWT is supplied, otherwise sets req.userId = null and proceeds without error.
 *
 * Token payload structure:
 *  { userId: string, email: string }
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

/**
 * Helper to extract Bearer token from Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/**
 * Strict authentication middleware.
 * Halts request with 401 if valid JWT is not provided.
 *
 * @type {import('express').RequestHandler}
 */
export function requireAuth(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    return next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional authentication middleware.
 * Attaches userId if valid token exists; otherwise req.userId = null.
 * Never halts the request with 401.
 *
 * @type {import('express').RequestHandler}
 */
export function optionalAuth(req, _res, next) {
  const token = extractBearerToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.user = decoded;
    } catch (_err) {
      req.userId = null;
      req.user = null;
    }
  } else {
    req.userId = null;
    req.user = null;
  }

  return next();
}
