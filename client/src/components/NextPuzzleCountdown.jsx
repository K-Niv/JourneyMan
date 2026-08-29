/**
 * client/src/components/NextPuzzleCountdown.jsx
 * ===============================================
 * Real-time countdown timer displaying time remaining until the next daily puzzle (UTC midnight).
 */

import { useState, useEffect } from 'react';
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
    <div className="flex flex-col items-center justify-center p-3.5 rounded-none bg-[#F5ECDF] border-2 border-[#0F0024] shadow-brutal-sm font-sans">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F0024] mb-2 font-poeltl">
        <Clock className="w-3.5 h-3.5 text-[#0F0024]" />
        <span>Next Puzzle In</span>
      </div>

      <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-mono font-bold tracking-widest text-[#0F0024]">
        <span className="bg-white px-2.5 py-1 rounded-none border-2 border-[#0F0024] shadow-brutal-sm">
          {timeLeft.hours}
        </span>
        <span className="text-[#0F0024] font-extrabold">:</span>
        <span className="bg-white px-2.5 py-1 rounded-none border-2 border-[#0F0024] shadow-brutal-sm">
          {timeLeft.minutes}
        </span>
        <span className="text-[#0F0024] font-extrabold">:</span>
        <span className="bg-white px-2.5 py-1 rounded-none border-2 border-[#0F0024] shadow-brutal-sm">
          {timeLeft.seconds}
        </span>
      </div>
    </div>
  );
}
