/**
 * client/src/components/LandingLoader.jsx
 * ========================================
 * Full-screen loading overlay displayed on the landing page while
 * the daily puzzle details and authentication profile are being fetched.
 *
 * Features:
 * - High-contrast Poeltl brutalist design (cream backdrop, sharp borders, gold accents)
 * - Complete interaction blocking (fixed z-50 overlay, pointer-events-auto, cursor-wait)
 * - Unified loading messaging (per design feedback)
 * - Full accessibility with role="status", aria-live="polite", and keyboard isolation
 */

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LandingLoader() {
  // Prevent keyboard focus interaction with elements beneath the overlay while active
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default navigation keys (Tab, Enter, Space) from interacting with elements behind the overlay
      if (['Tab', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading today's puzzle and account details"
      data-testid="landing-loader"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5ECDF]/85 backdrop-blur-[2px] select-none pointer-events-auto cursor-wait"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="bg-white border-2 border-[#0F0024] p-6 sm:p-8 shadow-brutal max-w-sm w-full mx-4 flex flex-col items-center text-center animate-fade-in">
        {/* JM Brand Badge with spinning loader icon */}
        <div className="relative mb-4">
          <div className="w-14 h-14 bg-[#DAAE4F] border-2 border-[#0F0024] flex items-center justify-center shadow-brutal-sm">
            <span className="font-extrabold text-[#0F0024] text-xl font-poeltl tracking-tighter">
              JM
            </span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white border-2 border-[#0F0024] p-1 rounded-none shadow-brutal-sm">
            <Loader2 className="w-4 h-4 text-[#0F0024] animate-spin" />
          </div>
        </div>

        {/* Display Headline */}
        <h3 className="text-lg sm:text-xl font-extrabold text-[#0F0024] font-poeltl tracking-tight uppercase mb-2">
          Loading Daily Puzzle
        </h3>

        {/* Unified Subheading */}
        <p className="text-xs sm:text-sm text-[#5A5A5A] font-medium leading-relaxed">
          Preparing today&apos;s NBA career timeline challenge…
        </p>
      </div>
    </div>
  );
}
