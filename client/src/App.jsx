/**
 * client/src/App.jsx
 * ===================
 * Root application component.
 *
 * PR 07: Game board with feedback animations, submit integration,
 * locked slots, and game over modal with career timeline and countdown.
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePuzzleLoader } from './hooks/usePuzzleLoader.js';
import { useGameStore } from './stores/gameStore.js';
import { MAX_ATTEMPTS, FEEDBACK } from 'shared';
import { cn } from '@/lib/utils';

// Components
import Header from '@/components/Header';
import PlayerInfo from '@/components/PlayerInfo';
import GuessGrid from '@/components/GuessGrid';
import GameOverModal from '@/components/GameOverModal';
import { Button } from '@/components/ui/button';
import { Eraser, Send, Loader2, Trophy } from 'lucide-react';

export default function App() {
  const { isLoading, error } = usePuzzleLoader();

  // Game state
  const puzzleId = useGameStore((s) => s.puzzleId);
  const puzzleNumber = useGameStore((s) => s.puzzleNumber);
  const puzzleDate = useGameStore((s) => s.puzzleDate);
  const difficulty = useGameStore((s) => s.difficulty);
  const player = useGameStore((s) => s.player);
  const stintCount = useGameStore((s) => s.stintCount);
  const availableTeams = useGameStore((s) => s.availableTeams);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const guesses = useGameStore((s) => s.guesses);
  const feedback = useGameStore((s) => s.feedback);
  const currentGuess = useGameStore((s) => s.currentGuess);
  const maxAttempts = useGameStore((s) => s.maxAttempts);
  const isSubmitting = useGameStore((s) => s.isSubmitting);
  const answer = useGameStore((s) => s.answer);

  // Actions
  const setSlot = useGameStore((s) => s.setSlot);
  const swapSlots = useGameStore((s) => s.swapSlots);
  const clearCurrentGuess = useGameStore((s) => s.clearCurrentGuess);
  const submitGuess = useGameStore((s) => s.submitGuess);

  // Modal display state
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const prevGameStatusRef = useRef(gameStatus);

  useEffect(() => {
    // Only automatically pop up the game over modal if transitioning from active playing to won/lost during this session
    if (
      (gameStatus === 'won' || gameStatus === 'lost') &&
      prevGameStatusRef.current === 'playing'
    ) {
      const timer = setTimeout(() => {
        setShowGameOverModal(true);
      }, 750);
      return () => clearTimeout(timer);
    }
    prevGameStatusRef.current = gameStatus;
  }, [gameStatus]);

  // Derived state
  const allSlotsFilled = currentGuess.length > 0 && currentGuess.every((t) => t !== null);
  
  // Can clear if there are any filled slots that aren't locked
  const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;
  const hasClearableSlot = currentGuess.some((t, idx) => {
    if (!t) return false;
    if (lastFeedback && lastFeedback[idx] === FEEDBACK.CORRECT) return false;
    return true;
  });

  const isPlaying = gameStatus === 'playing';

  // Scale main container comfortably on desktop for large stint counts (e.g. 7-9 stints)
  const mainWidthClass = stintCount >= 7 ? 'max-w-xl' : 'max-w-lg';

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground">
      {/* Header */}
      <Header puzzleNumber={puzzleNumber} puzzleDate={puzzleDate} />

      {/* Main content */}
      <main className={cn('w-full mx-auto px-3 sm:px-4 pb-8 flex-1 flex flex-col gap-4', mainWidthClass)}>
        {/* Initial loading state (only before puzzleId is known) */}
        {isLoading && !puzzleId && (
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-8 shadow-2xl text-center mt-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading today's puzzle…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !puzzleId && (
          <div className="bg-red-950/50 border border-red-500/20 rounded-2xl p-6 shadow-2xl mt-8">
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">
              Notice
            </p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Game loaded */}
        {puzzleId && (
          <>
            {/* Player info card */}
            <PlayerInfo
              player={player}
              difficulty={difficulty}
              stintCount={stintCount}
              guessesUsed={guesses.length}
              maxAttempts={maxAttempts ?? MAX_ATTEMPTS}
            />

            {/* Guess grid */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl">
              <GuessGrid
                guesses={guesses}
                feedback={feedback}
                currentGuess={currentGuess}
                stintCount={stintCount}
                gameStatus={gameStatus}
                availableTeams={availableTeams}
                onSelectTeam={setSlot}
                onSwap={swapSlots}
              />
            </div>

            {/* Action buttons */}
            {isPlaying && (
              <div className="flex items-center gap-3">
                <Button
                  id="clear-guess-button"
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-400 hover:text-foreground hover:bg-slate-800"
                  onClick={clearCurrentGuess}
                  disabled={!hasClearableSlot || isSubmitting}
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  id="submit-guess-button"
                  className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold"
                  onClick={submitGuess}
                  disabled={!allSlotsFilled || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Guess
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Game over status card on board */}
            {!isPlaying && (gameStatus === 'won' || gameStatus === 'lost') && (
              <div
                className={cn(
                  'rounded-2xl p-5 text-center shadow-2xl border flex flex-col items-center gap-3',
                  gameStatus === 'won'
                    ? 'bg-emerald-950/40 border-emerald-500/30'
                    : 'bg-slate-900/80 border-slate-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{gameStatus === 'won' ? '🎉' : '😔'}</span>
                  <h3
                    className={cn(
                      'text-lg font-bold',
                      gameStatus === 'won' ? 'text-emerald-400' : 'text-slate-200'
                    )}
                  >
                    {gameStatus === 'won'
                      ? `Solved in ${guesses.length}/${maxAttempts ?? MAX_ATTEMPTS} guesses!`
                      : 'Game Over — Better luck tomorrow!'}
                  </h3>
                </div>
                <Button
                  id="view-results-button"
                  variant="outline"
                  className={cn(
                    'w-full max-w-xs font-semibold',
                    gameStatus === 'won'
                      ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  )}
                  onClick={() => setShowGameOverModal(true)}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View Results & Timeline
                </Button>
              </div>
            )}

            {/* GameOverModal */}
            <GameOverModal
              open={showGameOverModal}
              onOpenChange={setShowGameOverModal}
              gameStatus={gameStatus}
              player={player}
              difficulty={difficulty}
              guessesCount={guesses.length}
              maxAttempts={maxAttempts ?? MAX_ATTEMPTS}
              answer={answer}
              puzzleNumber={puzzleNumber}
            />
          </>
        )}
      </main>
    </div>
  );
}
