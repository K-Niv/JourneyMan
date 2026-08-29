/**
 * client/src/hooks/useLiveAnnouncer.js
 * =====================================
 * Custom hook providing screen reader live announcements (aria-live="polite").
 */

import { useState, useCallback } from 'react';

export function useLiveAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message) => {
    if (!message) return;
    setAnnouncement(message);
  }, []);

  const clearAnnouncement = useCallback(() => {
    setAnnouncement('');
  }, []);

  return { announce, clearAnnouncement, announcement };
}

export default useLiveAnnouncer;
