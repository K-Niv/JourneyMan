/**
 * client/src/hooks/useKeyboardShortcuts.js
 * =========================================
 * Custom hook for desktop keyboard accessibility.
 *
 * Shortcuts:
 *  - 1-9: Open team picker for slot index (0 to 8)
 *  - Backspace / Delete: Clear the last filled unlocked slot
 *  - Enter: Submit guess (or trigger invalid submit shake)
 *  - c / C: Clear all unlocked slots
 *  - ? or /: Open How to Play modal
 *  - h / H: Open History / Stats modal
 *  - Escape: Handled by Radix / closes dialogs
 */

import { useEffect, useCallback } from 'react';

/**
 * Check if the active element is a text input where typing should not trigger shortcuts.
 */
function isInputElement(element) {
  if (!element) return false;
  const tag = element.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    element.isContentEditable ||
    element.getAttribute('role') === 'textbox' ||
    element.getAttribute('role') === 'searchbox'
  );
}

export function useKeyboardShortcuts({
  enabled = true,
  stintCount = 0,
  currentGuess = [],
  isPlaying = false,
  isSubmitting = false,
  onOpenSlot,
  onClearLastSlot,
  onClearAll,
  onSubmit,
  onInvalidSubmit,
  onOpenHelp,
  onOpenHistory,
}) {
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Ignore if user is currently typing in an input/search box
      if (isInputElement(document.activeElement)) return;

      // Ignore if modifier keys are pressed (e.g. Ctrl+C, Cmd+R)
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key;

      // 1. Number keys 1-9 for slot selection
      if (/^[1-9]$/.test(key)) {
        const slotIdx = parseInt(key, 10) - 1;
        if (slotIdx >= 0 && slotIdx < stintCount && isPlaying && !isSubmitting) {
          event.preventDefault();
          onOpenSlot?.(slotIdx);
        }
        return;
      }

      // 2. Enter key for submission
      if (key === 'Enter') {
        if (isPlaying && !isSubmitting) {
          event.preventDefault();
          const allFilled =
            currentGuess.length === stintCount && currentGuess.every((t) => t !== null);
          if (allFilled) {
            onSubmit?.();
          } else {
            onInvalidSubmit?.();
          }
        }
        return;
      }

      // 3. Backspace / Delete for clearing last filled unlocked slot
      if (key === 'Backspace' || key === 'Delete') {
        if (isPlaying && !isSubmitting) {
          event.preventDefault();
          onClearLastSlot?.();
        }
        return;
      }

      // 4. 'c' / 'C' key for clearing all slots
      if (key === 'c' || key === 'C') {
        if (isPlaying && !isSubmitting) {
          event.preventDefault();
          onClearAll?.();
        }
        return;
      }

      // 5. '?' or '/' for Help modal
      if (key === '?' || key === '/') {
        event.preventDefault();
        onOpenHelp?.();
        return;
      }

      // 6. 'h' / 'H' for History modal
      if (key === 'h' || key === 'H') {
        event.preventDefault();
        onOpenHistory?.();
        return;
      }
    },
    [
      enabled,
      stintCount,
      currentGuess,
      isPlaying,
      isSubmitting,
      onOpenSlot,
      onClearLastSlot,
      onClearAll,
      onSubmit,
      onInvalidSubmit,
      onOpenHelp,
      onOpenHistory,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
