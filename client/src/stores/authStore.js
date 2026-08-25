/**
 * client/src/stores/authStore.js
 * ===============================
 * Zustand store managing user identity.
 *
 * For PR 05 this is **anonymous-only**: a UUID is generated on first visit
 * and persisted to localStorage indefinitely so the server can associate
 * guess history with this browser session.
 *
 * PR 09 (Auth & Account Linking) will extend this store with:
 *  - `user` object (email, displayName)
 *  - `token` (JWT)
 *  - login / register / link actions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * @typedef {object} AuthState
 * @property {object|null}  user          - Authenticated user profile (null for anon)
 * @property {string|null}  token         - JWT access token (null until PR 09)
 * @property {string|null}  anonymousId   - Client-generated UUID for anonymous sessions
 */

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // State
      // -----------------------------------------------------------------------
      user: null,
      token: null,
      anonymousId: null,

      // -----------------------------------------------------------------------
      // Actions
      // -----------------------------------------------------------------------

      /**
       * Generate an anonymous session ID if one doesn't already exist.
       * Called once on app mount (in App.jsx / usePuzzleLoader).
       *
       * Uses `crypto.randomUUID()` which is available in all modern browsers
       * in secure contexts (HTTPS + localhost).
       */
      ensureAnonymousId: () => {
        const { anonymousId } = get();
        if (!anonymousId) {
          set({ anonymousId: crypto.randomUUID() });
        }
      },

      /**
       * Build the identity headers object for the API client.
       * The API client calls this via `getState()` on every request.
       *
       * @returns {Record<string, string>}
       */
      getHeaders: () => {
        const { anonymousId, token } = get();
        const headers = {};
        if (anonymousId) {
          headers['X-Anonymous-Id'] = anonymousId;
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
      },

      /**
       * Reset to a clean anonymous state.
       * Useful for testing and (later) logout.
       */
      clearSession: () => {
        set({ user: null, token: null, anonymousId: null });
      },
    }),
    {
      name: 'journeyman-auth',
      // Persist everything — anonymousId must survive across sessions
    }
  )
);
