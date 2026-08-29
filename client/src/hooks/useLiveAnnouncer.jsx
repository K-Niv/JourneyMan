/**
 * client/src/hooks/useLiveAnnouncer.jsx
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

  const AnnouncerRegion = useCallback(
    () => (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-announcer"
      >
        {announcement}
      </div>
    ),
    [announcement]
  );

  return { announce, AnnouncerRegion, announcement };
}

export default useLiveAnnouncer;
