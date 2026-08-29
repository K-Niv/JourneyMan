/**
 * client/src/components/BoardSkeleton.jsx
 * ========================================
 * Loading skeleton mirroring the game board structure.
 * Prevents layout shift (CLS) while today's puzzle is being fetched.
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function BoardSkeleton({ stintCount = 4 }) {
  const rowCount = 6;
  const slots = Array.from({ length: stintCount });

  return (
    <div
      data-testid="board-skeleton"
      aria-label="Loading puzzle"
      role="status"
      className="w-full flex flex-col gap-4 animate-fade-in font-sans"
    >
      {/* Player Info Card Skeleton */}
      <div className="bg-white border-2 border-[#0F0024] p-5 shadow-brutal">
        <div className="flex items-start gap-4">
          {/* Headshot skeleton */}
          <Skeleton className="w-20 h-20 rounded-none shrink-0 bg-slate-300 border-2 border-[#0F0024]" />

          {/* Player details skeleton */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-7 w-40 rounded-none bg-slate-300" />
              <Skeleton className="h-6 w-20 rounded-none shrink-0 bg-slate-300" />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-8 rounded-none bg-slate-300" />
                <Skeleton className="h-3 w-10 rounded-none bg-slate-300" />
              </div>
              <div className="w-px h-8 bg-[#0F0024]/20" />
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-12 rounded-none bg-slate-300" />
                <Skeleton className="h-3 w-12 rounded-none bg-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guess Grid Skeleton */}
      <div className="bg-white border-2 border-[#0F0024] p-4 sm:p-5 shadow-brutal">
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {/* Row number skeleton */}
              <div className="w-5 sm:w-6 shrink-0 flex justify-center">
                <Skeleton className="h-4 w-3 rounded-none bg-slate-300" />
              </div>

              {/* Slot tiles skeleton */}
              <div
                className="flex-1 grid gap-1.5 sm:gap-2.5 min-w-0"
                style={{ gridTemplateColumns: `repeat(${stintCount}, minmax(0, 1fr))` }}
              >
                {slots.map((_, slotIdx) => (
                  <Skeleton
                    key={slotIdx}
                    className="w-full aspect-square rounded-none bg-[#F5ECDF] border-2 border-[#0F0024]/20"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-none bg-slate-300" />
        <Skeleton className="h-10 flex-1 rounded-none bg-slate-300" />
      </div>
    </div>
  );
}
