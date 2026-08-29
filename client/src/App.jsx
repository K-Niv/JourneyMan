/**
 * client/src/App.jsx
 * ===================
 * Root application component.
 *
 * PR 07: Game board with feedback animations, submit integration,
 * locked slots, and game over modal with career timeline and countdown.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePuzzleLoader } from './hooks/usePuzzleLoader.js';
import { useGameStore } from './stores/gameStore.js';
import { useAuthStore } from './stores/authStore.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { useLiveAnnouncer } from './hooks/useLiveAnnouncer.js';
import { toast } from './stores/toastStore.js';
import { MAX_ATTEMPTS, FEEDBACK } from 'shared';
import { cn } from '@/lib/utils';

// Components
import Header from '@/components/Header';
import PlayerInfo from '@/components/PlayerInfo';
import GuessGrid from '@/components/GuessGrid';
import GameOverModal from '@/components/GameOverModal';
import BoardSkeleton from '@/components/BoardSkeleton';
import ToastContainer from '@/components/ui/ToastContainer';
import { Button } from '@/components/ui/button';
import { Eraser, Send, Loader2, Trophy } from 'lucide-react';

export default function App() {
  const { isLoading, error } = usePuzzleLoader();
  const { announce, announcement } = useLiveAnnouncer();

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
  const clearSlot = useGameStore((s) => s.clearSlot);
  const swapSlots = useGameStore((s) => s.swapSlots);
  const clearCurrentGuess = useGameStore((s) => s.clearCurrentGuess);
  const submitGuess = useGameStore((s) => s.submitGuess);

  // Auth state for history modal trigger
  const user = useAuthStore((s) => s.user);

  // Modal & UI interaction state
  const [showHelp, setShowHelp] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [openSlotIndex, setOpenSlotIndex] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const prevGameStatusRef = useRef(gameStatus);
  const prevGuessesCountRef = useRef(guesses.length);

  // Trigger shake animation & audio/haptic/toast warning on invalid submit
  const triggerInvalidSubmit = useCallback(() => {
    setIsShaking(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 30]);
    }
    toast.warning(
      'Incomplete Guess',
      `Please fill all ${stintCount || 4} slots before submitting.`
    );
    announce(`Please fill all ${stintCount || 4} slots before submitting.`);
    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  }, [stintCount, announce]);

  // Handle guess submission with validation
  const handleAttemptSubmit = useCallback(() => {
    const allFilled =
      currentGuess.length === stintCount && currentGuess.every((t) => t !== null);
    if (allFilled) {
      submitGuess();
    } else {
      triggerInvalidSubmit();
    }
  }, [currentGuess, stintCount, submitGuess, triggerInvalidSubmit]);

  // Clear latest non-locked slot via keyboard Backspace
  const handleClearLastSlot = useCallback(() => {
    const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;
    for (let i = currentGuess.length - 1; i >= 0; i--) {
      if (currentGuess[i]) {
        if (lastFeedback && lastFeedback[i] === FEEDBACK.CORRECT) {
          continue;
        }
        clearSlot(i);
        break;
      }
    }
  }, [currentGuess, feedback, clearSlot]);

  // Announce puzzle load to screen readers
  useEffect(() => {
    if (puzzleId && player?.name) {
      announce(
        `JourneyMan puzzle #${puzzleNumber} loaded for ${player.name}. Difficulty is ${difficulty}, with ${stintCount} career stints to guess.`
      );
    }
  }, [puzzleId, puzzleNumber, player?.name, difficulty, stintCount, announce]);

  // Announce guess results or game over
  useEffect(() => {
    if (guesses.length > prevGuessesCountRef.current && feedback.length > 0) {
      const latestFeedback = feedback[feedback.length - 1];
      const correctCount = latestFeedback.filter((f) => f === FEEDBACK.CORRECT).length;
      const misplacedCount = latestFeedback.filter((f) => f === FEEDBACK.MISPLACED).length;
      const incorrectCount = latestFeedback.filter((f) => f === FEEDBACK.INCORRECT).length;

      if (gameStatus === 'won') {
        announce(`Congratulations! You solved the puzzle in ${guesses.length} attempts.`);
      } else if (gameStatus === 'lost') {
        announce(`Game over. Better luck tomorrow.`);
      } else {
        announce(
          `Guess ${guesses.length} graded: ${correctCount} correct, ${misplacedCount} misplaced, ${incorrectCount} incorrect. ${
            (maxAttempts ?? MAX_ATTEMPTS) - guesses.length
          } attempts remaining.`
        );
      }
    }
    prevGuessesCountRef.current = guesses.length;
  }, [guesses.length, feedback, gameStatus, maxAttempts, announce]);

  // Automatically show Game Over modal on win/loss
  useEffect(() => {
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

  // Connectivity alerts (online/offline)
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Connection Restored', 'You are back online.');
    };
    const handleOffline = () => {
      toast.warning('Offline Mode', 'Connection lost. Your local gameplay is saved.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Desktop keyboard shortcuts
  const anyModalOpen =
    showHelp || showAuthModal || showHistoryModal || showGameOverModal || openSlotIndex !== null;

  useKeyboardShortcuts({
    enabled: !anyModalOpen,
    stintCount,
    currentGuess,
    feedback,
    isPlaying: gameStatus === 'playing',
    isSubmitting,
    onOpenSlot: (slotIdx) => setOpenSlotIndex(slotIdx),
    onClearLastSlot: handleClearLastSlot,
    onClearAll: clearCurrentGuess,
    onSubmit: handleAttemptSubmit,
    onInvalidSubmit: triggerInvalidSubmit,
    onOpenHelp: () => setShowHelp(true),
    onOpenHistory: () => {
      if (user) {
        setShowHistoryModal(true);
      } else {
        toast.info(
          'Sign in to view your history',
          'Create a free account or sign in to track your streaks, stats, and calendar history.'
        );
        setShowAuthModal(true);
      }
    },
  });

  // Derived state
  const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;
  const hasClearableSlot = currentGuess.some((t, idx) => {
    if (!t) return false;
    if (lastFeedback && lastFeedback[idx] === FEEDBACK.CORRECT) return false;
    return true;
  });

  const isPlaying = gameStatus === 'playing';
  const mainWidthClass = stintCount >= 7 ? 'max-w-xl' : 'max-w-lg';

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground selection:bg-amber-500 selection:text-slate-950">
      {/* Screen Reader Live Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-announcer"
      >
        {announcement}
      </div>

      {/* Header */}
      <Header
        puzzleNumber={puzzleNumber}
        puzzleDate={puzzleDate}
        showHelp={showHelp}
        onHelpOpenChange={setShowHelp}
        showAuthModal={showAuthModal}
        onAuthOpenChange={setShowAuthModal}
        showHistoryModal={showHistoryModal}
        onHistoryOpenChange={setShowHistoryModal}
      />

      {/* Main content */}
      <main className={cn('w-full mx-auto px-3 sm:px-4 pb-8 flex-1 flex flex-col gap-4', mainWidthClass)}>
        {/* Layout-stable Loading Skeleton */}
        {isLoading && !puzzleId && (
          <BoardSkeleton stintCount={stintCount || 4} />
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
                isShaking={isShaking}
                openSlotIndex={openSlotIndex}
                onOpenSlot={(idx) => setOpenSlotIndex(idx)}
                onCloseSlot={() => setOpenSlotIndex(null)}
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
                  className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-md active:scale-98 transition-transform"
                  onClick={handleAttemptSubmit}
                  disabled={isSubmitting}
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

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
