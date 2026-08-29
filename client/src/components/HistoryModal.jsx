/**
 * client/src/components/HistoryModal.jsx
 * =======================================
 * Modal displaying authenticated user stats, attempt distribution,
 * and monthly calendar history.
 *
 * Features:
 *  - Lazy data fetching on modal open
 *  - Tab navigation between Statistics view and Monthly Calendar view
 *  - Month-by-month historical results fetching
 *  - Loading skeleton & error handling
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import StatsPanel from './StatsPanel';
import CalendarGrid from './CalendarGrid';
import { fetchStats, fetchHistory } from '../services/api';
import { cn } from '@/lib/utils';

/**
 * Skeleton placeholder for StatsPanel during loading.
 */
function StatsSkeleton() {
  return (
    <div data-testid="stats-skeleton" className="space-y-6 animate-fade-in">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg space-y-2"
          >
            <Skeleton className="h-7 w-12 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
        ))}
      </div>

      {/* Avg attempts pill skeleton */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border border-slate-800/60 rounded-lg">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-4 w-12 rounded" />
      </div>

      {/* Guess distribution skeleton */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="w-3 h-4 rounded shrink-0" />
              <Skeleton className="flex-1 h-6 rounded-md bg-slate-900/80" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for CalendarGrid during loading.
 */
function CalendarSkeleton() {
  return (
    <div data-testid="calendar-skeleton" className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Grid */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-6 mx-auto rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg bg-slate-900/50" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HistoryModal({ open, onOpenChange }) {
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'calendar'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stats state
  const [stats, setStats] = useState(null);

  // Calendar state
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getUTCFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getUTCMonth() + 1);
  const [historyResults, setHistoryResults] = useState([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  // Load initial stats & current month's history when modal opens
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsRes, historyRes] = await Promise.all([
        fetchStats(),
        fetchHistory(calendarYear, calendarMonth),
      ]);
      setStats(statsRes.stats);
      setHistoryResults(historyRes.history);
    } catch (err) {
      setError(err.message || 'Failed to load your play history.');
    } finally {
      setIsLoading(false);
    }
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  // Handle month change in calendar
  const handleMonthChange = async (newYear, newMonth) => {
    setCalendarYear(newYear);
    setCalendarMonth(newMonth);
    setIsCalendarLoading(true);

    try {
      const historyRes = await fetchHistory(newYear, newMonth);
      setHistoryResults(historyRes.history);
    } catch (err) {
      console.error('Failed to load month history:', err);
    } finally {
      setIsCalendarLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="history-modal"
        className="w-full max-w-md bg-slate-950/95 border-slate-800 text-slate-100 p-5 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-xl max-h-[90vh] flex flex-col gap-4 overflow-hidden"
      >
        <DialogHeader className="space-y-1 text-center shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight font-display bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            Your Journey
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Track your puzzle record, win streaks, and monthly stats.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switchers */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            id="history-stats-tab"
            onClick={() => setActiveTab('stats')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Statistics
          </button>
          <button
            type="button"
            id="history-calendar-tab"
            onClick={() => setActiveTab('calendar')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
              activeTab === 'calendar'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendar
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-[300px]">
          {isLoading ? (
            activeTab === 'stats' ? (
              <StatsSkeleton />
            ) : (
              <CalendarSkeleton />
            )
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center p-4 bg-red-950/20 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-xs text-red-300">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="text-xs border-slate-700 hover:bg-slate-800"
              >
                Try Again
              </Button>
            </div>
          ) : activeTab === 'stats' ? (
            <StatsPanel stats={stats} />
          ) : isCalendarLoading ? (
            <CalendarSkeleton />
          ) : (
            <CalendarGrid
              results={historyResults}
              year={calendarYear}
              month={calendarMonth}
              onMonthChange={handleMonthChange}
              isLoading={isCalendarLoading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
