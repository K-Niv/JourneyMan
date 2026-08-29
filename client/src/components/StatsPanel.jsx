/**
 * client/src/components/StatsPanel.jsx
 * ====================================
 * Statistics dashboard displaying high-level metrics and guess distribution.
 *
 * Metrics:
 *  - Games Played
 *  - Win Rate %
 *  - Current Streak 🔥
 *  - Max Streak ⭐
 *  - Guess Attempt Distribution (1-6 + Fail) with pure CSS responsive bar charts
 */

import { Flame, Trophy, Award, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatsPanel({ stats }) {
  if (!stats) return null;

  const {
    gamesPlayed = 0,
    gamesWon = 0,
    winRate = 0,
    currentStreak = 0,
    maxStreak = 0,
    averageAttempts = 0,
    attemptDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 },
  } = stats;

  const maxDistributionVal = Math.max(
    1,
    ...Object.values(attemptDistribution)
  );

  const distributionKeys = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Played */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-slate-100 pointer-events-none group-hover:scale-110 transition-transform">
            <Target className="w-16 h-16" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight font-display">
            {gamesPlayed}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
            Played
          </span>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-5 text-emerald-400 pointer-events-none group-hover:scale-110 transition-transform">
            <Trophy className="w-16 h-16" />
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight font-display">
            {winRate}%
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
            Win Rate
          </span>
        </div>

        {/* Current Streak */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-amber-500 pointer-events-none group-hover:scale-110 transition-transform">
            <Flame className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight font-display">
              {currentStreak}
            </span>
            <Flame className="w-4 h-4 text-amber-500 animate-pulse fill-amber-500/30" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
            Current Streak
          </span>
        </div>

        {/* Max Streak */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-orange-500 pointer-events-none group-hover:scale-110 transition-transform">
            <Award className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-orange-400 tracking-tight font-display">
              {maxStreak}
            </span>
            <Award className="w-4 h-4 text-orange-400" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
            Max Streak
          </span>
        </div>
      </div>

      {/* Average attempts info pill */}
      {gamesWon > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border border-slate-800/60 rounded-lg text-xs text-slate-300">
          <span className="text-slate-400">Avg Guesses per Solved Game:</span>
          <span className="font-bold text-amber-400">{averageAttempts} / 6</span>
        </div>
      )}

      {/* Attempt Distribution Horizontal Bar Chart */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2 text-slate-200">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
            Guess Distribution
          </h4>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {distributionKeys.map((attemptNum) => {
            const count = attemptDistribution[attemptNum] || 0;
            const percentage = Math.round((count / maxDistributionVal) * 100);
            const isHighest = count > 0 && count === maxDistributionVal;

            return (
              <div key={attemptNum} className="flex items-center gap-2.5">
                <span className="w-3 text-slate-400 font-bold text-right">
                  {attemptNum}
                </span>
                <div className="flex-1 bg-slate-950/80 rounded-md h-6 p-0.5 flex items-center overflow-hidden border border-slate-800/40">
                  <div
                    className={cn(
                      'h-full rounded flex items-center justify-end px-2 transition-all duration-500 ease-out font-sans text-xs font-bold',
                      count === 0
                        ? 'w-0 min-w-0 bg-transparent text-slate-600'
                        : isHighest
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    )}
                    style={{
                      width: count > 0 ? `${Math.max(8, percentage)}%` : '0%',
                    }}
                  >
                    {count > 0 && <span>{count}</span>}
                  </div>
                  {count === 0 && (
                    <span className="text-[10px] text-slate-600 font-sans pl-2">
                      0
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Failed / Unsolved row if any */}
          {attemptDistribution.fail > 0 && (
            <div className="flex items-center gap-2.5 pt-1">
              <span className="w-3 text-red-400 font-bold text-right text-[11px]">
                X
              </span>
              <div className="flex-1 bg-slate-950/80 rounded-md h-6 p-0.5 flex items-center overflow-hidden border border-red-950/40">
                <div
                  className="h-full rounded flex items-center justify-end px-2 bg-red-900/60 border border-red-500/30 text-red-200 transition-all duration-500 font-sans text-xs font-bold"
                  style={{
                    width: `${Math.max(8, Math.round((attemptDistribution.fail / maxDistributionVal) * 100))}%`,
                  }}
                >
                  {attemptDistribution.fail}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
