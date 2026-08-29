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
            className="bg-[#F5ECDF] border-2 border-[#0F0024] p-3.5 flex flex-col items-center justify-center text-center shadow-brutal-sm space-y-2"
          >
            <Skeleton className="h-7 w-12 rounded-none bg-slate-300" />
            <Skeleton className="h-3 w-14 rounded-none bg-slate-300" />
          </div>
        ))}
      </div>

      {/* Avg attempts pill skeleton */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#F5ECDF] border-2 border-[#0F0024]">
        <Skeleton className="h-4 w-40 rounded-none bg-slate-300" />
        <Skeleton className="h-4 w-12 rounded-none bg-slate-300" />
      </div>

      {/* Guess distribution skeleton */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32 rounded-none bg-slate-300" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="w-3 h-4 rounded-none bg-slate-300 shrink-0" />
              <Skeleton className="flex-1 h-6 rounded-none bg-[#F5ECDF] border border-[#0F0024]" />
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
        <Skeleton className="h-5 w-32 rounded-none bg-slate-300" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded-none bg-slate-300" />
          <Skeleton className="h-8 w-8 rounded-none bg-slate-300" />
        </div>
      </div>

      {/* Grid */}
      <div className="bg-[#F5ECDF] border-2 border-[#0F0024] p-3 sm:p-4 shadow-brutal-sm">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-6 mx-auto rounded-none bg-slate-300" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-none bg-white border border-[#0F0024]/20" />
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
        className="w-full max-w-md bg-white border-2 border-[#0F0024] text-[#212121] p-5 sm:p-6 rounded-none shadow-brutal max-h-[90vh] flex flex-col gap-4 overflow-hidden font-sans"
      >
        <DialogHeader className="space-y-1 text-center shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight font-poeltl text-[#0F0024] uppercase">
            Your Journey
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5A5A5A]">
            Track your puzzle record, win streaks, and monthly stats.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switchers */}
        <div className="flex bg-[#F5ECDF] p-1 border-2 border-[#0F0024] shrink-0">
          <button
            type="button"
            id="history-stats-tab"
            onClick={() => setActiveTab('stats')}
            className={cn(
              'flex-1 py-1.5 px-3 rounded-none text-xs font-bold font-poeltl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5',
              activeTab === 'stats'
                ? 'bg-[#DAAE4F] text-[#0F0024] border border-[#0F0024] shadow-brutal-sm'
                : 'text-[#0F0024] hover:bg-[#DAAE4F]/20'
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
              'flex-1 py-1.5 px-3 rounded-none text-xs font-bold font-poeltl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5',
              activeTab === 'calendar'
                ? 'bg-[#DAAE4F] text-[#0F0024] border border-[#0F0024] shadow-brutal-sm'
                : 'text-[#0F0024] hover:bg-[#DAAE4F]/20'
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
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center p-4 bg-red-50 border-2 border-red-700 text-red-900">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <p className="text-xs font-semibold">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="text-xs border-2 border-[#0F0024] bg-white font-bold"
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
