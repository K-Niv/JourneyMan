/**
 * client/src/stores/toastStore.js
 * ================================
 * Zustand store for managing toast notifications.
 */

import { create } from 'zustand';

export const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * Add a toast notification.
   *
   * @param {{ message: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error', duration?: number }} toast
   */
  toast: ({ message, description, type = 'success', duration = 4000 }) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newToast = { id, message, description, type };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  /**
   * Remove a toast notification by ID.
   *
   * @param {string} id
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

/**
 * Convenient helper functions
 */
export const toast = {
  success: (message, description, duration) =>
    useToastStore.getState().toast({ message, description, type: 'success', duration }),
  info: (message, description, duration) =>
    useToastStore.getState().toast({ message, description, type: 'info', duration }),
  warning: (message, description, duration) =>
    useToastStore.getState().toast({ message, description, type: 'warning', duration }),
  error: (message, description, duration) =>
    useToastStore.getState().toast({ message, description, type: 'error', duration }),
};
