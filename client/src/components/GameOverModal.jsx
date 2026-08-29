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

import { useEffect } from 'react';
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
        colors: ['#DAAE4F', '#0F0024', '#10b981', '#3b82f6'],
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
      <DialogContent className="w-full max-w-md bg-white border-2 border-[#0F0024] text-[#212121] p-5 sm:p-6 rounded-none shadow-brutal max-h-[85vh] sm:max-h-[80vh] flex flex-col gap-3 overflow-hidden font-sans">
        <DialogHeader className="text-center sm:text-center shrink-0">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-none bg-[#DAAE4F] border-2 border-[#0F0024] text-2xl shadow-brutal-sm">
            {isWon ? '🎉' : '😔'}
          </div>

          <DialogTitle className="text-2xl font-extrabold tracking-tight font-poeltl text-[#0F0024] uppercase">
            {isWon ? 'You Solved It!' : 'Game Over'}
          </DialogTitle>

          <DialogDescription className="text-[#5A5A5A] text-sm">
            {isWon
              ? `Solved in ${guessesCount} ${guessesCount === 1 ? 'guess' : 'guesses'}!`
              : 'Better luck with tomorrow’s journey!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 flex-1 overflow-y-auto pr-1">
          {/* Player Summary Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-[#F5ECDF] border-2 border-[#0F0024] shadow-brutal-sm">
            {player?.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-14 h-14 object-cover border-2 border-[#0F0024] bg-white shrink-0"
              />
            ) : (
              <div className="w-14 h-14 border-2 border-[#0F0024] bg-white flex items-center justify-center text-xl shrink-0">
                🏀
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-[#0F0024] truncate text-base font-poeltl">
                  {player?.name ?? 'Mystery Player'}
                </h3>
                {diffConfig && (
                  <Badge className={`shrink-0 text-[11px] rounded-none font-bold ${diffConfig.className}`}>
                    <span className="mr-1">{diffConfig.emoji}</span>
                    {diffConfig.label}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#5A5A5A] mt-0.5 font-semibold">
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

        <div className="mt-2 shrink-0 pt-2 border-t border-[#0F0024]/20">
          <Button
            variant="outline"
            className="w-full border-2 border-[#0F0024] bg-white text-[#0F0024] hover:bg-[#DAAE4F]/20 font-bold"
            onClick={() => onOpenChange(false)}
          >
            Close & View Board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
