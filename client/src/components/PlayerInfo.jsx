/**
 * client/src/components/PlayerInfo.jsx
 * ======================================
 * Displays the mystery player's info card: headshot, name,
 * difficulty badge, and key stats (stint count, guesses remaining).
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DIFFICULTY } from 'shared';
import { cn } from '@/lib/utils';

/**
 * Difficulty badge styling configuration.
 * Maps difficulty keys to colors and display properties.
 */
const DIFFICULTY_CONFIG = {
  [DIFFICULTY.EASY]: {
    emoji: '🟢',
    label: 'Easy',
    className: 'bg-emerald-100 text-emerald-900 border-2 border-emerald-700',
  },
  [DIFFICULTY.MEDIUM]: {
    emoji: '🟡',
    label: 'Medium',
    className: 'bg-amber-100 text-amber-900 border-2 border-amber-600',
  },
  [DIFFICULTY.HARD]: {
    emoji: '🔴',
    label: 'Hard',
    className: 'bg-red-100 text-red-900 border-2 border-red-700',
  },
  [DIFFICULTY.EXPERT]: {
    emoji: '💀',
    label: 'Expert',
    className: 'bg-purple-100 text-purple-900 border-2 border-purple-700',
  },
};

export default function PlayerInfo({
  player,
  difficulty,
  stintCount,
  guessesUsed,
  maxAttempts,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  return (
    <div
      className="bg-white border-2 border-[#0F0024] p-4 sm:p-5 shadow-brutal transition-all font-sans"
      role="region"
      aria-label="Mystery Player Profile"
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Player image */}
        <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 border-2 border-[#0F0024] bg-[#F5ECDF] shadow-brutal-sm overflow-hidden">
          {player?.imageUrl ? (
            <>
              {!imageLoaded && (
                <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
              )}
              <img
                src={player.imageUrl}
                alt={player.name || 'Mystery Player'}
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                loading="eager"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xl sm:text-2xl" role="img" aria-label="Basketball icon">🏀</span>
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#0F0024] truncate tracking-tight font-poeltl">
              {player?.name ?? 'Mystery Player'}
            </h2>
            {diffConfig && (
              <Badge className={cn('shrink-0 text-xs py-0.5 rounded-none font-bold', diffConfig.className)}>
                <span className="mr-1">{diffConfig.emoji}</span>
                {diffConfig.label}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2 sm:mt-3">
            <div className="text-center">
              <p className="text-base sm:text-lg font-extrabold text-[#0F0024] font-poeltl">{stintCount}</p>
              <p className="text-[9px] sm:text-[10px] text-[#5A5A5A] uppercase tracking-wider font-bold">
                Stints
              </p>
            </div>
            <div className="w-px h-7 sm:h-8 bg-[#0F0024]/20" />
            <div className="text-center">
              <p className="text-base sm:text-lg font-extrabold text-[#0F0024] font-poeltl">
                {guessesUsed}/{maxAttempts}
              </p>
              <p className="text-[9px] sm:text-[10px] text-[#5A5A5A] uppercase tracking-wider font-bold">
                Guesses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
