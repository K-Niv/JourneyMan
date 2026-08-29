/**
 * server/src/middleware/csrf.js
 * ==============================
 * CSRF Protection middleware using the Double-Submit Cookie pattern.
 *
 * How it works:
 * 1. Safe methods (GET, HEAD, OPTIONS):
 *    - Ensure a readable `XSRF-TOKEN` cookie exists on the client.
 *    - Generates and sets a new cryptographically secure token if absent.
 * 2. Mutating methods (POST, PUT, PATCH, DELETE):
 *    - Verifies that the `X-CSRF-Token` (or `X-XSRF-Token`) request header matches
 *      the `XSRF-TOKEN` cookie value.
 *    - Returns 403 Forbidden if the token is missing or mismatched.
 *
 * Exported helpers manage HTTP-only auth cookies and CSRF tokens uniformly.
 */

import crypto from 'crypto';
import { config } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'journeyman_token';
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_HEADER_NAME_ALT = 'x-xsrf-token';

/**
 * Generate a cryptographically secure random token for CSRF.
 * @returns {string} 64-character hex string
 */
export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * HTTP-only auth cookie options for JWT token.
 * Prevents client-side script access (XSS mitigation).
 */
export function getAuthCookieOptions() {
  const sameSite = config.cookieSameSite || (config.isProd ? 'lax' : 'lax');
  const secure = config.isProd || sameSite === 'none';
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Readable CSRF cookie options.
 * Readable by client JS so it can be extracted and sent in request headers.
 */
export function getCsrfCookieOptions() {
  const sameSite = config.cookieSameSite || (config.isProd ? 'lax' : 'lax');
  const secure = config.isProd || sameSite === 'none';
  return {
    httpOnly: false,
    secure,
    sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Set both the HTTP-only auth token and the CSRF cookie on an Express response.
 *
 * @param {import('express').Response} res
 * @param {string} authToken - JWT token string
 * @returns {string} The generated CSRF token string
 */
export function setAuthCookies(res, authToken) {
  const csrfToken = generateCsrfToken();
  res.cookie(AUTH_COOKIE_NAME, authToken, getAuthCookieOptions());
  res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
  return csrfToken;
}

/**
 * Clear auth and CSRF cookies on logout.
 *
 * @param {import('express').Response} res
 */
export function clearAuthCookies(res) {
  const authOpts = getAuthCookieOptions();
  const csrfOpts = getCsrfCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: authOpts.httpOnly,
    secure: authOpts.secure,
    sameSite: authOpts.sameSite,
    path: authOpts.path,
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: csrfOpts.httpOnly,
    secure: csrfOpts.secure,
    sameSite: csrfOpts.sameSite,
    path: csrfOpts.path,
  });
}

/**
 * Safe HTTP methods that do not modify state.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Express middleware for Double-Submit Cookie CSRF protection.
 *
 * @type {import('express').RequestHandler}
 */
export function csrfProtection(req, res, next) {
  const isSafeMethod = SAFE_METHODS.has(req.method);

  // For safe requests, ensure an XSRF-TOKEN cookie exists
  if (isSafeMethod) {
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      const freshCsrf = generateCsrfToken();
      res.cookie(CSRF_COOKIE_NAME, freshCsrf, getCsrfCookieOptions());
      req.csrfToken = freshCsrf;
    } else {
      req.csrfToken = req.cookies[CSRF_COOKIE_NAME];
    }
    return next();
  }

  // For mutating requests (POST, PUT, PATCH, DELETE):
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers[CSRF_HEADER_NAME_ALT];
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  // In test environment, if neither cookie nor header is passed and enforcement is not flagged, bypass
  if (config.isTest && !cookieToken && !headerToken && req.headers['x-enforce-csrf'] !== 'true') {
    return next();
  }

  // Validate double-submit matching: both must exist and be identical
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
  }

  return next();
}
