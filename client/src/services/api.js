/**
 * client/src/services/api.js
 * ===========================
 * Centralised HTTP client for all JourneyMan API calls.
 *
 * Every request flows through `request()` which:
 *  - Prepends the `/api` base path (Vite proxies this in dev)
 *  - Sets JSON content-type headers
 *  - Attaches identity headers from the auth store (X-Anonymous-Id, future JWT)
 *  - Throws an `ApiError` with status + parsed body on non-2xx responses
 *
 * Consumers import the named endpoint helpers (`fetchTodaysPuzzle`, `submitGuess`)
 * rather than calling `request()` directly.
 */

import { useAuthStore } from '../stores/authStore.js';

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

/**
 * Custom error thrown when the API returns a non-2xx status code.
 * Carries the HTTP status and parsed response body so callers can
 * branch on status (e.g. 404 vs 409 vs 500).
 */
/**
 * Map status codes to user-friendly fallback messages.
 * Used when the server response doesn't contain a meaningful error string.
 */
const USER_FRIENDLY_ERRORS = {
  400: 'Something was wrong with that request. Please try again.',
  404: "Today's puzzle isn't available yet. Please check back later.",
  409: 'This action has already been completed.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The server is temporarily unavailable. Please try again later.',
};

export class ApiError extends Error {
  /**
   * @param {number} status  - HTTP status code
   * @param {object} body    - Parsed JSON response body
   */
  constructor(status, body) {
    // Use the server's error message for 4xx (actionable), but fall back
    // to a generic user-friendly message for 5xx or missing body.
    const serverMsg = body?.error;
    const friendlyMsg = USER_FRIENDLY_ERRORS[status]
      ?? 'Something went wrong. Please try again later.';
    // For 5xx, always use the friendly message (server already sanitises,
    // but this is a safety net on the client side too).
    const displayMsg = (status >= 500 || !serverMsg) ? friendlyMsg : serverMsg;
    super(displayMsg);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const rawBase = (import.meta.env?.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
const BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

/**
 * Extract XSRF-TOKEN cookie from document.cookie.
 * @returns {string|null}
 */
export function getCsrfTokenFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Low-level request helper.
 *
 * @param {string} path     - API path (e.g. '/puzzle/today')
 * @param {object} [options] - fetch options override
 * @returns {Promise<any>}  - Parsed JSON response
 * @throws {ApiError}       - On non-2xx responses
 */
async function request(path, options = {}) {
  const { headers: customHeaders, method = 'GET', ...rest } = options;
  const upperMethod = method.toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod);

  // If this is a mutating request and no CSRF cookie is present, bootstrap it via /auth/csrf
  let csrfToken = getCsrfTokenFromCookie();
  if (isMutating && !csrfToken && path !== '/auth/csrf') {
    try {
      const csrfRes = await fetch(`${BASE}/auth/csrf`, { credentials: 'include' });
      if (csrfRes.ok) {
        const data = await csrfRes.json();
        csrfToken = data.csrfToken || getCsrfTokenFromCookie();
      }
    } catch {
      // Proceed; server will validate
    }
  }

  // Build headers — identity headers are injected lazily so the auth store
  // doesn't need to be imported at module-load time (avoids circular deps).
  const headers = {
    'Content-Type': 'application/json',
    ...getIdentityHeaders(),
    ...(csrfToken && isMutating ? { 'X-CSRF-Token': csrfToken } : {}),
    ...customHeaders,
  };

  const res = await fetch(`${BASE}${path}`, {
    method: upperMethod,
    headers,
    credentials: 'include',
    ...rest,
  });

  // Parse body (some error responses may not be JSON)
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body;
}

/**
 * Read identity headers from the persisted auth store.
 * Delegates to the store's own `getHeaders()` so there is a single source
 * of truth.
 *
 * @returns {Record<string, string>}
 */
function getIdentityHeaders() {
  return useAuthStore.getState().getHeaders();
}

// ---------------------------------------------------------------------------
// Public endpoint helpers
// ---------------------------------------------------------------------------

/**
 * Fetch today's puzzle.
 *
 * @returns {Promise<object>} Puzzle DTO (puzzleId, player, difficulty, etc.)
 */
export async function fetchTodaysPuzzle() {
  return request('/puzzle/today');
}

/**
 * Submit a guess for today's puzzle.
 *
 * @param {string[]} guess - Array of team IDs (one per stint slot)
 * @returns {Promise<object>} Graded response (feedback, won, gameOver, etc.)
 */
export async function submitGuessToApi(guess) {
  return request('/puzzle/guess', {
    method: 'POST',
    body: JSON.stringify({ guess }),
  });
}

// ---------------------------------------------------------------------------
// Auth endpoint helpers
// ---------------------------------------------------------------------------

/**
 * Register a new user account.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} [displayName]
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerUser(email, password, displayName) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}

/**
 * Log in with existing credentials.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Link an anonymous session history to the authenticated user.
 *
 * @param {string} anonymousId - The anonymous UUID to link
 * @returns {Promise<{ message: string, migratedCount: number }>}
 */
export async function linkAnonymousAccount(anonymousId) {
  return request('/auth/link', {
    method: 'POST',
    body: JSON.stringify({ anonymousId }),
  });
}

/**
 * Fetch the authenticated user profile.
 *
 * @returns {Promise<{ user: object }>}
 */
export async function fetchUserProfile() {
  return request('/auth/me');
}

/**
 * Log out user and clear auth cookies on server.
 *
 * @returns {Promise<{ message: string }>}
 */
export async function logoutUser() {
  return request('/auth/logout', { method: 'POST' });
}

/**
 * Fetch a fresh CSRF token from the server.
 *
 * @returns {Promise<{ csrfToken: string }>}
 */
export async function fetchCsrfToken() {
  return request('/auth/csrf');
}

// ---------------------------------------------------------------------------
// History & Stats endpoint helpers
// ---------------------------------------------------------------------------

/**
 * Fetch monthly game history for the authenticated user.
 *
 * @param {number|string} [year]  - 4-digit year (e.g. 2026)
 * @param {number|string} [month] - 1-based month (1-12)
 * @returns {Promise<{ history: Array<object> }>}
 */
export async function fetchHistory(year, month) {
  const params = new URLSearchParams();
  if (year) params.set('year', year);
  if (month) params.set('month', month);
  const qs = params.toString();
  return request(`/history${qs ? `?${qs}` : ''}`);
}

/**
 * Fetch aggregate game statistics and streaks for the authenticated user.
 *
 * @returns {Promise<{ stats: object }>}
 */
export async function fetchStats() {
  return request('/history/stats');
}

