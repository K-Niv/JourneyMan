/**
 * client/src/App.jsx
 * ===================
 * Root application component for JourneyMan.
 *
 * Features:
 * - Poeltl-inspired light theme & brand identity
 * - Multi-view support: Daily Puzzle Game, Modern Landing Page, Dedicated Auth Page
 * - Top navigation bar with live status and mobile menu
 * - Accessible keyboard shortcuts & live screen reader announcements
 * - Locked stints, drag-and-drop feedback grid, and game-over modals
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
import LandingPage from '@/components/LandingPage';
import AuthPage from '@/components/AuthPage';
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

  // Navigation view state: 'landing' (default landing page) | 'game' | 'auth'
  const [currentView, setCurrentView] = useState('landing');

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

  // Desktop keyboard shortcuts (active only during gameplay)
  const anyModalOpen =
    showHelp || showAuthModal || showHistoryModal || showGameOverModal || openSlotIndex !== null;

  useKeyboardShortcuts({
    enabled: !anyModalOpen && currentView === 'game',
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
    <div className="min-h-screen flex flex-col items-center bg-[#F5ECDF] text-[#212121] selection:bg-[#DAAE4F] selection:text-[#0F0024] font-sans">
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

      {/* Modern Navigation Bar Header */}
      <Header
        puzzleNumber={puzzleNumber}
        puzzleDate={puzzleDate}
        activeView={currentView}
        onNavigate={setCurrentView}
        showHelp={showHelp}
        onHelpOpenChange={setShowHelp}
        showAuthModal={showAuthModal}
        onAuthOpenChange={setShowAuthModal}
        showHistoryModal={showHistoryModal}
        onHistoryOpenChange={setShowHistoryModal}
      />

      {/* ===================================================================== */}
      {/* VIEW 1: LANDING PAGE */}
      {/* ===================================================================== */}
      {currentView === 'landing' && (
        <LandingPage
          onPlay={() => setCurrentView('game')}
          onOpenHelp={() => setShowHelp(true)}
          onOpenAuth={() => setShowAuthModal(true)}
          puzzleNumber={puzzleNumber}
          puzzleDate={puzzleDate}
        />
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: DEDICATED AUTH PAGE */}
      {/* ===================================================================== */}
      {currentView === 'auth' && (
        <AuthPage
          onBack={() => setCurrentView('game')}
          onPlay={() => setCurrentView('game')}
        />
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: DAILY GAMEPLAY BOARD */}
      {/* ===================================================================== */}
      {currentView === 'game' && (
        <main className={cn('w-full mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-12 flex-1 flex flex-col gap-4', mainWidthClass)}>
          {/* Layout-stable Loading Skeleton */}
          {isLoading && !puzzleId && (
            <BoardSkeleton stintCount={stintCount || 4} />
          )}

          {/* Error state */}
          {error && !puzzleId && (
            <div className="bg-red-50 border-2 border-red-700 p-6 shadow-brutal mt-6">
              <p className="text-xs text-red-700 font-bold uppercase tracking-wider mb-1 font-poeltl">
                Game Board Notice
              </p>
              <p className="text-sm text-red-950 font-semibold">{error}</p>
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
              <div className="bg-white border-2 border-[#0F0024] p-4 sm:p-5 shadow-brutal">
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
                    variant="secondary"
                    className="flex-1 border-2 border-[#DAAE4F] text-[#0F0024] bg-white hover:bg-[#DAAE4F]/10 font-bold shadow-brutal-sm rounded-[2px]"
                    onClick={clearCurrentGuess}
                    disabled={!hasClearableSlot || isSubmitting}
                  >
                    <Eraser className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    id="submit-guess-button"
                    variant="primary"
                    className="flex-1 bg-[#DAAE4F] text-[#0F0024] hover:bg-[#cda245] font-extrabold shadow-brutal hover:shadow-brutal-lg rounded-[2px] active:scale-98 transition-transform uppercase tracking-wider text-sm"
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
                    'p-5 text-center shadow-brutal border-2 border-[#0F0024] flex flex-col items-center gap-3',
                    gameStatus === 'won' ? 'bg-emerald-50' : 'bg-white'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{gameStatus === 'won' ? '🎉' : '😔'}</span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#0F0024] font-poeltl uppercase">
                      {gameStatus === 'won'
                        ? `Solved in ${guesses.length}/${maxAttempts ?? MAX_ATTEMPTS} guesses!`
                        : 'Game Over — Better luck tomorrow!'}
                    </h3>
                  </div>
                  <Button
                    id="view-results-button"
                    variant="primary"
                    className="w-full max-w-xs font-extrabold bg-[#DAAE4F] text-[#0F0024] shadow-brutal hover:shadow-brutal-lg rounded-[2px] uppercase tracking-wider"
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
      )}

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
