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

const BASE = '/api';

/**
 * Low-level request helper.
 *
 * @param {string} path     - API path (e.g. '/puzzle/today')
 * @param {object} [options] - fetch options override
 * @returns {Promise<any>}  - Parsed JSON response
 * @throws {ApiError}       - On non-2xx responses
 */
async function request(path, options = {}) {
  const { headers: customHeaders, ...rest } = options;

  // Build headers — identity headers are injected lazily so the auth store
  // doesn't need to be imported at module-load time (avoids circular deps).
  const headers = {
    'Content-Type': 'application/json',
    ...getIdentityHeaders(),
    ...customHeaders,
  };

  const res = await fetch(`${BASE}${path}`, { headers, ...rest });

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
 * of truth — when PR 09 adds new auth headers, only authStore needs updating.
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
