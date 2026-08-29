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
import { BarChart3, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import StatsPanel from './StatsPanel';
import CalendarGrid from './CalendarGrid';
import { fetchStats, fetchHistory } from '../services/api';
import { cn } from '@/lib/utils';

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
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs">Loading your stats…</p>
            </div>
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
