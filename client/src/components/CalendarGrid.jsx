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
  [DIFFICULTY.EASY]: { label: 'Easy', emoji: '🟢', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' },
  [DIFFICULTY.MEDIUM]: { label: 'Medium', emoji: '🟡', bg: 'bg-amber-950/60 text-amber-300 border-amber-500/30' },
  [DIFFICULTY.HARD]: { label: 'Hard', emoji: '🔴', bg: 'bg-rose-950/60 text-rose-300 border-rose-500/30' },
  [DIFFICULTY.EXPERT]: { label: 'Expert', emoji: '💀', bg: 'bg-purple-950/60 text-purple-300 border-purple-500/30' },
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
    <div className="space-y-4">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm sm:text-base text-slate-100 font-display">
            {MONTH_NAMES[month - 1]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30"
            onClick={handlePrevMonth}
            disabled={!canGoPrev || isLoading}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30"
            onClick={handleNextMonth}
            disabled={isLoading}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 sm:p-4 shadow-inner">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center mb-2">
          {WEEKDAYS.map((d) => (
            <span
              key={d}
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {/* Leading blank slots */}
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="aspect-square rounded-lg p-1" />
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

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isFuture || !result}
                onClick={() => {
                  if (result) {
                    setSelectedResult(isSelected ? null : result);
                  }
                }}
                className={cn(
                  'aspect-square rounded-lg p-1 flex flex-col items-center justify-between text-xs transition-all relative group',
                  // Base styling
                  isFuture
                    ? 'opacity-25 cursor-default bg-slate-900/20 text-slate-600'
                    : result
                    ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-sm'
                    : 'cursor-default bg-slate-900/40 text-slate-400',

                  // Won vs Lost vs Unplayed
                  isWon &&
                    'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/70',
                  isLost &&
                    'bg-red-950/50 border border-red-500/40 text-red-200 hover:bg-red-950/70',
                  !result && !isFuture && 'border border-slate-800/40',

                  // Today indicator
                  isToday && 'ring-2 ring-amber-500/80 ring-offset-1 ring-offset-slate-950 font-bold',

                  // Selected item
                  isSelected && 'ring-2 ring-amber-400 shadow-lg scale-105 z-10'
                )}
              >
                {/* Day number */}
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-semibold leading-none self-start',
                    isToday ? 'text-amber-400 font-extrabold' : 'text-slate-300'
                  )}
                >
                  {d}
                </span>

                {/* Status indicator inside cell */}
                {isWon && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">
                      {result.attempts}/6
                    </span>
                  </div>
                )}

                {isLost && (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-rose-400 font-mono">
                      X
                    </span>
                  </div>
                )}

                {!result && !isFuture && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800/80 mb-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Preview Card */}
      {selectedResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 font-semibold">
                Puzzle #{selectedResult.puzzleNumber} · {selectedResult.date}
              </span>
              {selectedResult.difficulty && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] px-1.5 py-0 h-4 border uppercase font-bold tracking-wider',
                    DIFFICULTY_CONFIG[selectedResult.difficulty]?.bg
                  )}
                >
                  {DIFFICULTY_CONFIG[selectedResult.difficulty]?.emoji}{' '}
                  {DIFFICULTY_CONFIG[selectedResult.difficulty]?.label}
                </Badge>
              )}
            </div>
            <p className="text-sm font-bold text-slate-100 truncate">
              {selectedResult.playerName}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedResult.won ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{selectedResult.attempts}/6 Guesses</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/60 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                <span>Unsolved</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
