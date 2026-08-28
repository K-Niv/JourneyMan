/**
 * server/src/controllers/authController.js
 * =========================================
 * Express request/response handlers for authentication endpoints.
 *
 * Each controller method:
 *  1. Extracts request params & payload
 *  2. Delegates to authService
 *  3. Sends structured JSON response with proper HTTP status codes
 *  4. Returns sanitized error messages
 */

import {
  registerUser,
  loginUser,
  getUserProfile,
  linkAnonymousAccount,
} from '../services/authService.js';

/**
 * Register a new user account.
 *
 * @type {import('express').RequestHandler}
 */
export async function register(req, res) {
  const { email, password, displayName } = req.body ?? {};

  try {
    const payload = await registerUser(email, password, displayName);
    return res.status(201).json(payload);
  } catch (err) {
    const status = err.statusCode ?? 500;
    const message = status < 500 ? err.message : 'Internal server error.';
    return res.status(status).json({ error: message });
  }
}

/**
 * Authenticate existing user with email and password.
 *
 * @type {import('express').RequestHandler}
 */
export async function login(req, res) {
  const { email, password } = req.body ?? {};

  try {
    const payload = await loginUser(email, password);
    return res.status(200).json(payload);
  } catch (err) {
    const status = err.statusCode ?? 500;
    const message = status < 500 ? err.message : 'Internal server error.';
    return res.status(status).json({ error: message });
  }
}

/**
 * Fetch authenticated user's profile.
 *
 * @type {import('express').RequestHandler}
 */
export async function getMe(req, res) {
  try {
    const user = await getUserProfile(req.userId);
    return res.status(200).json({ user });
  } catch (err) {
    const status = err.statusCode ?? 500;
    const message = status < 500 ? err.message : 'Internal server error.';
    return res.status(status).json({ error: message });
  }
}

/**
 * Migrate anonymous game history to the authenticated user account.
 *
 * @type {import('express').RequestHandler}
 */
export async function linkAccount(req, res) {
  const { anonymousId } = req.body ?? {};

  try {
    const result = await linkAnonymousAccount(req.userId, anonymousId);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode ?? 500;
    const message = status < 500 ? err.message : 'Internal server error.';
    return res.status(status).json({ error: message });
  }
}
