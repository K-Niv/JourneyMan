/**
 * client/src/components/NextPuzzleCountdown.jsx
 * ===============================================
 * Real-time countdown timer displaying time remaining until the next daily puzzle (UTC midnight).
 */

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function calculateTimeLeft() {
  const now = new Date();
  const nextMidnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );

  const diff = Math.max(0, nextMidnight.getTime() - now.getTime());

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export default function NextPuzzleCountdown() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span>Next Puzzle In</span>
      </div>

      <div className="flex items-center gap-1 text-xl sm:text-2xl font-mono font-bold tracking-widest text-amber-400">
        <span className="bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700/60 shadow-sm">
          {timeLeft.hours}
        </span>
        <span className="text-slate-500 animate-pulse">:</span>
        <span className="bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700/60 shadow-sm">
          {timeLeft.minutes}
        </span>
        <span className="text-slate-500 animate-pulse">:</span>
        <span className="bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700/60 shadow-sm">
          {timeLeft.seconds}
        </span>
      </div>
    </div>
  );
}
