/**
 * server/src/middleware/anonymousUser.js
 * =======================================
 * Reads the X-Anonymous-Id header and attaches a sanitised anonymousId to
 * req.anonymousId.  If the header is absent or malformed, req.anonymousId is
 * set to null so downstream handlers can decide how to proceed.
 *
 * Format rules:
 *  - Must be a non-empty string
 *  - Max 128 characters (prevents DB column abuse)
 *  - Stripped of leading/trailing whitespace
 *
 * This middleware never rejects a request — anonymous play is always allowed.
 * Authenticated routes (PR 09) will have their own auth middleware in addition.
 */

const MAX_ANON_ID_LENGTH = 128;

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function anonymousUser(req, _res, next) {
  const raw = req.headers['x-anonymous-id'];

  if (typeof raw === 'string' && raw.trim().length > 0) {
    // Truncate silently — never error on this header
    req.anonymousId = raw.trim().slice(0, MAX_ANON_ID_LENGTH);
  } else {
    req.anonymousId = null;
  }

  next();
}
