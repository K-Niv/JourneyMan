/**
 * client/src/components/GameOverModal.jsx
 * =========================================
 * Celebratory or concluding game over modal triggered on win or loss.
 *
 * Includes:
 *  - Dynamic win / loss banner & styling
 *  - Player card & difficulty pill
 *  - Attempt statistics summary
 *  - Confetti burst on victory
 *  - Full AnswerTimeline of career stints
 *  - Live NextPuzzleCountdown
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AnswerTimeline from './AnswerTimeline';
import NextPuzzleCountdown from './NextPuzzleCountdown';
import { DIFFICULTY } from 'shared';

const DIFFICULTY_CONFIG = {
  [DIFFICULTY.EASY]: {
    emoji: '🟢',
    label: 'Easy',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  [DIFFICULTY.MEDIUM]: {
    emoji: '🟡',
    label: 'Medium',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  },
  [DIFFICULTY.HARD]: {
    emoji: '🔴',
    label: 'Hard',
    className: 'bg-red-500/15 text-red-400 border-red-500/25',
  },
  [DIFFICULTY.EXPERT]: {
    emoji: '💀',
    label: 'Expert',
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  },
};

export default function GameOverModal({
  open,
  onOpenChange,
  gameStatus,
  player,
  difficulty,
  guessesCount,
  maxAttempts,
  answer,
  puzzleNumber,
}) {
  const isWon = gameStatus === 'won';
  const diffConfig = DIFFICULTY_CONFIG[difficulty];

  // Fire celebratory confetti when win modal opens
  useEffect(() => {
    if (open && isWon) {
      // Primary burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
      });

      // Secondary side cannons for enhanced effect
      const cannonTimer = setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
        });
      }, 250);

      return () => clearTimeout(cannonTimer);
    }
  }, [open, isWon]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md bg-slate-950/95 border-slate-800 text-foreground p-5 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-xl max-h-[85vh] sm:max-h-[80vh] flex flex-col gap-3 overflow-hidden">
        <DialogHeader className="text-center sm:text-center shrink-0">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-2xl shadow-inner">
            {isWon ? '🎉' : '😔'}
          </div>

          <DialogTitle className="text-2xl font-extrabold tracking-tight">
            {isWon ? (
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                You Solved It!
              </span>
            ) : (
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Game Over
              </span>
            )}
          </DialogTitle>

          <DialogDescription className="text-muted-foreground text-sm">
            {isWon
              ? `Solved in ${guessesCount} ${guessesCount === 1 ? 'guess' : 'guesses'}!`
              : 'Better luck with tomorrow’s journey!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Player Summary Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            {player?.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-14 h-14 rounded-lg object-cover border border-slate-700 bg-slate-800 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-xl shrink-0">
                🏀
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-foreground truncate text-base">
                  {player?.name ?? 'Mystery Player'}
                </h3>
                {diffConfig && (
                  <Badge className={`shrink-0 text-[11px] ${diffConfig.className}`}>
                    <span className="mr-1">{diffConfig.emoji}</span>
                    {diffConfig.label}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {puzzleNumber ? `Puzzle #${puzzleNumber} · ` : ''}
                {guessesCount} of {maxAttempts} attempts used
              </p>
            </div>
          </div>

          {/* Official Career Timeline */}
          <AnswerTimeline answer={answer} />

          {/* Countdown to Next Puzzle */}
          <NextPuzzleCountdown />
        </div>

        <div className="mt-2 shrink-0 pt-2 border-t border-slate-800/60">
          <Button
            variant="outline"
            className="w-full border-slate-800 hover:bg-slate-900 text-slate-300 font-medium"
            onClick={() => onOpenChange(false)}
          >
            Close & View Board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
