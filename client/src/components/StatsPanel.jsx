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
    <div className="space-y-6 font-sans">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Played */}
        <div className="bg-[#F5ECDF] border-2 border-[#0F0024] p-3.5 flex flex-col items-center justify-center text-center shadow-brutal-sm relative overflow-hidden">
          <span className="text-2xl sm:text-3xl font-extrabold text-[#0F0024] tracking-tight font-poeltl">
            {gamesPlayed}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#5A5A5A] font-bold mt-1">
            Played
          </span>
        </div>

        {/* Win Rate */}
        <div className="bg-[#F5ECDF] border-2 border-[#0F0024] p-3.5 flex flex-col items-center justify-center text-center shadow-brutal-sm relative overflow-hidden">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight font-poeltl">
            {winRate}%
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#5A5A5A] font-bold mt-1">
            Win Rate
          </span>
        </div>

        {/* Current Streak */}
        <div className="bg-[#F5ECDF] border-2 border-[#0F0024] p-3.5 flex flex-col items-center justify-center text-center shadow-brutal-sm relative overflow-hidden">
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F0024] tracking-tight font-poeltl">
              {currentStreak}
            </span>
            <Flame className="w-4 h-4 text-[#DAAE4F] fill-[#DAAE4F]" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-[#5A5A5A] font-bold mt-1">
            Current Streak
          </span>
        </div>

        {/* Max Streak */}
        <div className="bg-[#F5ECDF] border-2 border-[#0F0024] p-3.5 flex flex-col items-center justify-center text-center shadow-brutal-sm relative overflow-hidden">
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F0024] tracking-tight font-poeltl">
              {maxStreak}
            </span>
            <Award className="w-4 h-4 text-[#DAAE4F]" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-[#5A5A5A] font-bold mt-1">
            Max Streak
          </span>
        </div>
      </div>

      {/* Average attempts info pill */}
      {gamesWon > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#F5ECDF] border-2 border-[#0F0024] text-xs text-[#0F0024] font-bold shadow-brutal-sm">
          <span className="text-[#5A5A5A]">Avg Guesses per Solved Game:</span>
          <span className="font-extrabold text-[#0F0024] font-poeltl">{averageAttempts} / 6</span>
        </div>
      )}

      {/* Attempt Distribution Horizontal Bar Chart */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2 text-[#0F0024]">
          <BarChart3 className="w-4 h-4 text-[#0F0024]" />
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0F0024] font-poeltl">
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
                <span className="w-3 text-[#0F0024] font-bold text-right">
                  {attemptNum}
                </span>
                <div className="flex-1 bg-[#F5ECDF] h-6 p-0.5 flex items-center overflow-hidden border border-[#0F0024]">
                  <div
                    className={cn(
                      'h-full flex items-center justify-end px-2 transition-all duration-500 ease-out font-sans text-xs font-bold border border-[#0F0024]',
                      count === 0
                        ? 'w-0 min-w-0 bg-transparent text-[#5A5A5A]'
                        : isHighest
                        ? 'bg-[#DAAE4F] text-[#0F0024]'
                        : 'bg-[#0F0024] text-[#F5ECDF]'
                    )}
                    style={{
                      width: count > 0 ? `${Math.max(8, percentage)}%` : '0%',
                    }}
                  >
                    {count > 0 && <span>{count}</span>}
                  </div>
                  {count === 0 && (
                    <span className="text-[10px] text-[#5A5A5A] font-sans pl-2 font-bold">
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
              <span className="w-3 text-red-600 font-bold text-right text-[11px]">
                X
              </span>
              <div className="flex-1 bg-[#F5ECDF] h-6 p-0.5 flex items-center overflow-hidden border border-red-800">
                <div
                  className="h-full flex items-center justify-end px-2 bg-red-600 text-white font-sans text-xs font-bold border border-[#0F0024]"
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
