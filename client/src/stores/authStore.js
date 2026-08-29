/**
 * client/src/stores/authStore.js
 * ===============================
 * Zustand store managing user identity and authentication lifecycle.
 *
 * Responsibilities:
 *  - Anonymous session management (UUID in localStorage)
 *  - User registration & login with JWT persistence
 *  - Automatic account linking on registration/login (migrates anonymous play history)
 *  - Profile verification & logout
 *  - Dynamic identity header generation for API client
 *  - Syncing game store puzzle state and toast feedback on auth state changes
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  registerUser,
  loginUser,
  logoutUser,
  linkAnonymousAccount,
  fetchUserProfile,
} from '../services/api.js';
import { useGameStore } from './gameStore.js';
import { toast } from './toastStore.js';

/**
 * @typedef {object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {string|null} displayName
 * @property {string} createdAt
 */

/**
 * @typedef {object} AuthState
 * @property {UserProfile|null} user           - Authenticated user profile (null for anon)
 * @property {string|null}      anonymousId    - Client-generated UUID for anonymous sessions
 * @property {boolean}          isAuthLoading  - Loading state for auth operations
 * @property {string|null}      authError      - Error message from last auth action
 */

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // State
      // -----------------------------------------------------------------------
      user: null,
      anonymousId: null,
      isAuthLoading: false,
      authError: null,

      // -----------------------------------------------------------------------
      // Actions
      // -----------------------------------------------------------------------

      /**
       * Generate an anonymous session ID if not logged in and one doesn't exist.
       * Called once on app mount.
       */
      ensureAnonymousId: () => {
        const { user, anonymousId } = get();
        if (!user && !anonymousId) {
          const newId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          set({ anonymousId: newId });
        }
      },

      /**
       * Build identity headers object for the API client.
       * Cookies are handled natively by the browser; guest UUID is sent in header.
       *
       * @returns {Record<string, string>}
       */
      getHeaders: () => {
        const { anonymousId } = get();
        const headers = {};
        if (anonymousId) {
          headers['X-Anonymous-Id'] = anonymousId;
        }
        return headers;
      },

      /**
       * Register a new account, establish cookie session, and migrate any anonymous history.
       *
       * @param {string} email
       * @param {string} password
       * @param {string} [displayName]
       * @returns {Promise<boolean>} Success indicator
       */
      register: async (email, password, displayName) => {
        set({ isAuthLoading: true, authError: null });
        const prevAnonymousId = get().anonymousId;

        try {
          const { user } = await registerUser(email, password, displayName);
          set({
            user,
            isAuthLoading: false,
            authError: null,
          });

          // If user had an anonymous history, link it to the newly registered account
          if (prevAnonymousId) {
            try {
              await linkAnonymousAccount(prevAnonymousId);
            } catch (linkErr) {
              console.warn('Account linking warning:', linkErr.message);
            } finally {
              set({ anonymousId: null });
            }
          }

          // Sync game store state from the newly registered account
          try {
            await useGameStore.getState().loadPuzzle({ forceSync: true });
          } catch {
            // Ignore background sync errors
          }

          toast.success(
            'Account created successfully!',
            "Today's puzzle progress has been saved to your account."
          );

          return true;
        } catch (err) {
          const message = err.message || 'Failed to register account. Please try again.';
          set({
            isAuthLoading: false,
            authError: message,
          });
          return false;
        }
      },

      /**
       * Log in with existing account, establish cookie session, and migrate any anonymous history.
       *
       * @param {string} email
       * @param {string} password
       * @returns {Promise<boolean>} Success indicator
       */
      login: async (email, password) => {
        set({ isAuthLoading: true, authError: null });
        const prevAnonymousId = get().anonymousId;

        try {
          const { user } = await loginUser(email, password);
          set({
            user,
            isAuthLoading: false,
            authError: null,
          });

          // Link any anonymous games played before logging in
          if (prevAnonymousId) {
            try {
              await linkAnonymousAccount(prevAnonymousId);
            } catch (linkErr) {
              console.warn('Account linking warning:', linkErr.message);
            } finally {
              set({ anonymousId: null });
            }
          }

          // Fetch and sync the account's existing puzzle progress across devices
          try {
            await useGameStore.getState().loadPuzzle({ forceSync: true });
          } catch {
            // Ignore background sync errors
          }

          toast.success(
            'Signed in successfully!',
            "Today's puzzle progress has been synced to your account."
          );

          return true;
        } catch (err) {
          const message = err.message || 'Invalid email or password.';
          set({
            isAuthLoading: false,
            authError: message,
          });
          return false;
        }
      },

      /**
       * Validate HTTP-only session cookie and refresh user profile on app load.
       */
      loadProfile: async () => {
        try {
          const { user } = await fetchUserProfile();
          set({ user });
        } catch (err) {
          // Cookie is expired or invalid — clear user auth state gracefully
          if (err.status === 401 || err.status === 404) {
            set({ user: null });
          }
        }
      },

      /**
       * Clear authentication credentials on server & client, and create a fresh anonymous session.
       */
      logout: async () => {
        try {
          await logoutUser();
        } catch {
          // Ignore network errors on logout
        }

        const freshAnonId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        set({
          user: null,
          authError: null,
          anonymousId: freshAnonId,
        });

        // Re-sync puzzle for the guest session
        try {
          useGameStore.getState().loadPuzzle({ forceSync: true });
        } catch {
          // Ignore
        }

        toast.info('Signed out.', 'You are now playing as a guest.');
      },

      /**
       * Clear current error message.
       */
      clearAuthError: () => {
        set({ authError: null });
      },

      /**
       * Full session reset.
       */
      clearSession: () => {
        set({
          user: null,
          anonymousId: null,
          authError: null,
          isAuthLoading: false,
        });
      },
    }),
    {
      name: 'journeyman-auth',
      partialize: (state) => ({
        anonymousId: state.anonymousId,
      }),
    }
  )
);
