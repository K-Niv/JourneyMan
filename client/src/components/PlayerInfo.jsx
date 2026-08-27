/**
 * client/src/components/PlayerInfo.jsx
 * ======================================
 * Displays the mystery player's info card: headshot, name,
 * difficulty badge, and key stats (stint count, guesses remaining).
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DIFFICULTY } from 'shared';

/**
 * Difficulty badge styling configuration.
 * Maps difficulty keys to colors and display properties.
 */
const DIFFICULTY_CONFIG = {
  [DIFFICULTY.EASY]: {
    emoji: '🟢',
    label: 'Easy',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15',
  },
  [DIFFICULTY.MEDIUM]: {
    emoji: '🟡',
    label: 'Medium',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25 hover:bg-yellow-500/15',
  },
  [DIFFICULTY.HARD]: {
    emoji: '🔴',
    label: 'Hard',
    className: 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/15',
  },
  [DIFFICULTY.EXPERT]: {
    emoji: '💀',
    label: 'Expert',
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/25 hover:bg-purple-500/15',
  },
};

export default function PlayerInfo({
  player,
  difficulty,
  stintCount,
  guessesUsed,
  maxAttempts,
}) {
  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-2xl">
      <div className="flex items-start gap-4">
        {/* Player image */}
        <div className="shrink-0">
          {player?.imageUrl ? (
            <img
              src={player.imageUrl}
              alt={player.name}
              className="w-20 h-20 rounded-xl object-cover border-2 border-slate-700 shadow-lg bg-slate-800"
              loading="eager"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">🏀</span>
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {player?.name ?? 'Mystery Player'}
            </h2>
            {diffConfig && (
              <Badge className={`shrink-0 ${diffConfig.className}`}>
                <span className="mr-1">{diffConfig.emoji}</span>
                {diffConfig.label}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">{stintCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Stints
              </p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">
                {guessesUsed}/{maxAttempts}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Guesses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
