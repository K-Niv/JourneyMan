/**
 * client/src/components/CalendarGrid.jsx
 * =====================================
 * Interactive monthly calendar showing game history with win/loss status.
 *
 * Constraints:
 *  - Earliest navigable month is August 2026 (app launch)
 *  - Shows day cells with green (won + attempts), red (lost), or muted (unplayed)
 *  - Clicking a completed day displays puzzle & player summary
 */

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DIFFICULTY } from 'shared';

const EARLIEST_YEAR = 2026;
const EARLIEST_MONTH = 8; // August 2026

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DIFFICULTY_CONFIG = {
  [DIFFICULTY.EASY]: { label: 'Easy', emoji: '🟢', bg: 'bg-emerald-100 text-emerald-900 border-2 border-emerald-700' },
  [DIFFICULTY.MEDIUM]: { label: 'Medium', emoji: '🟡', bg: 'bg-amber-100 text-amber-900 border-2 border-amber-600' },
  [DIFFICULTY.HARD]: { label: 'Hard', emoji: '🔴', bg: 'bg-rose-100 text-rose-900 border-2 border-rose-700' },
  [DIFFICULTY.EXPERT]: { label: 'Expert', emoji: '💀', bg: 'bg-purple-100 text-purple-900 border-2 border-purple-700' },
};

export default function CalendarGrid({
  results = [],
  year = 2026,
  month = 8,
  onMonthChange,
  isLoading = false,
}) {
  const [selectedResult, setSelectedResult] = useState(null);

  // Today in UTC
  const todayStr = new Date().toISOString().slice(0, 10);

  // Check if we can navigate further back
  const canGoPrev = year > EARLIEST_YEAR || (year === EARLIEST_YEAR && month > EARLIEST_MONTH);

  const handlePrevMonth = () => {
    if (!canGoPrev || isLoading) return;
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedResult(null);
    onMonthChange?.(newYear, newMonth);
  };

  const handleNextMonth = () => {
    if (isLoading) return;
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedResult(null);
    onMonthChange?.(newYear, newMonth);
  };

  // Calendar math for given year/month
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Create lookup map for results by date string
  const resultsByDate = new Map();
  for (const r of results) {
    resultsByDate.set(r.date, r);
  }

  // Generate grid cells
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-4 font-sans">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#0F0024]" />
          <h3 className="font-extrabold text-sm sm:text-base text-[#0F0024] font-poeltl uppercase">
            {MONTH_NAMES[month - 1]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none border border-[#0F0024] text-[#0F0024] hover:bg-[#DAAE4F]/20 disabled:opacity-30"
            onClick={handlePrevMonth}
            disabled={!canGoPrev || isLoading}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none border border-[#0F0024] text-[#0F0024] hover:bg-[#DAAE4F]/20 disabled:opacity-30"
            onClick={handleNextMonth}
            disabled={isLoading}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#F5ECDF] border-2 border-[#0F0024] p-3 sm:p-4 shadow-brutal-sm">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-2">
          {WEEKDAYS.map((d) => (
            <span
              key={d}
              className="text-[11px] font-bold text-[#0F0024] uppercase tracking-wider font-poeltl"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {/* Leading blank slots */}
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="aspect-square p-1" />
          ))}

          {/* Month day slots */}
          {days.map((d) => {
            const formattedDay = String(d).padStart(2, '0');
            const formattedMonth = String(month).padStart(2, '0');
            const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

            const result = resultsByDate.get(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isSelected = selectedResult?.date === dateStr;

            const isWon = result && result.won;
            const isLost = result && !result.won;

            const ariaDayLabel = isFuture
              ? `${MONTH_NAMES[month - 1]} ${d}, ${year}: Future date`
              : isWon
              ? `${MONTH_NAMES[month - 1]} ${d}, ${year}: Solved in ${result.attempts} guesses`
              : isLost
              ? `${MONTH_NAMES[month - 1]} ${d}, ${year}: Unsolved`
              : `${MONTH_NAMES[month - 1]} ${d}, ${year}: Not played`;

            return (
              <button
                key={dateStr}
                type="button"
                aria-label={ariaDayLabel}
                disabled={isFuture || !result}
                onClick={() => {
                  if (result) {
                    setSelectedResult(isSelected ? null : result);
                  }
                }}
                className={cn(
                  'aspect-square min-h-[40px] sm:min-h-[44px] rounded-none p-1 flex flex-col items-center justify-between text-xs transition-all relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DAAE4F] border',
                  // Base styling
                  isFuture
                    ? 'opacity-30 cursor-default bg-transparent text-[#5A5A5A] border-transparent'
                    : result
                    ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-brutal-sm'
                    : 'cursor-default bg-white/40 text-[#5A5A5A] border-[#0F0024]/20',

                  // Won vs Lost vs Unplayed
                  isWon &&
                    'bg-emerald-600 border-2 border-[#0F0024] text-white hover:bg-emerald-700',
                  isLost &&
                    'bg-red-600 border-2 border-[#0F0024] text-white hover:bg-red-700',

                  // Today indicator
                  isToday && 'ring-2 ring-[#0F0024] ring-offset-1 ring-offset-[#F5ECDF] font-extrabold',

                  // Selected item
                  isSelected && 'ring-2 ring-[#DAAE4F] shadow-brutal scale-105 z-10'
                )}
              >
                {/* Day number */}
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-bold leading-none self-start',
                    isWon || isLost ? 'text-white' : isToday ? 'text-[#0F0024] font-extrabold' : 'text-[#0F0024]'
                  )}
                >
                  {d}
                </span>

                {/* Status indicator inside cell */}
                {isWon && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-extrabold text-white font-mono">
                      {result.attempts}/6
                    </span>
                  </div>
                )}

                {isLost && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-extrabold text-white font-mono">
                      X
                    </span>
                  </div>
                )}

                {!result && !isFuture && (
                  <div className="w-1.5 h-1.5 bg-[#0F0024]/30 mb-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Preview Card */}
      {selectedResult && (
        <div className="bg-white border-2 border-[#0F0024] p-3.5 shadow-brutal flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#5A5A5A] font-bold">
                Puzzle #{selectedResult.puzzleNumber} · {selectedResult.date}
              </span>
              {selectedResult.difficulty && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-4 border uppercase font-bold tracking-wider rounded-none',
                    DIFFICULTY_CONFIG[selectedResult.difficulty]?.bg
                  )}
                >
                  {DIFFICULTY_CONFIG[selectedResult.difficulty]?.emoji}{' '}
                  {DIFFICULTY_CONFIG[selectedResult.difficulty]?.label}
                </Badge>
              )}
            </div>
            <p className="text-sm font-extrabold text-[#0F0024] truncate font-poeltl">
              {selectedResult.playerName}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedResult.won ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 border border-emerald-700 text-emerald-900 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{selectedResult.attempts}/6 Guesses</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 border border-red-700 text-red-900 text-xs font-bold">
                <XCircle className="w-3.5 h-3.5 text-red-700" />
                <span>Unsolved</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
