/**
 * client/src/components/GuessGrid.jsx
 * =====================================
 * Container for all guess rows (past, current, and future).
 *
 * Renders up to MAX_ATTEMPTS rows:
 *  1. Completed rows (past guesses with feedback colors)
 *  2. The active row (current guess with drag-and-drop & lock support)
 *  3. Empty placeholder rows (remaining attempts)
 */

import React from 'react';
import GuessRow from './GuessRow';
import { useGameStore } from '@/stores/gameStore';
import { MAX_ATTEMPTS } from 'shared';

export default function GuessGrid({
  guesses,
  feedback,
  currentGuess,
  stintCount,
  gameStatus,
  availableTeams,
  isShaking,
  openSlotIndex,
  onOpenSlot,
  onCloseSlot,
  onSelectTeam,
  onSwap,
}) {
  const lastSubmittedRowIndex = useGameStore((s) => s.lastSubmittedRowIndex);
  const rows = [];
  const lastFeedback = feedback.length > 0 ? feedback[feedback.length - 1] : null;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const isPastGuess = i < guesses.length;
    const isActiveRow = i === guesses.length && gameStatus === 'playing';
    const isRevealing = isPastGuess && i === lastSubmittedRowIndex;

    rows.push(
      <GuessRow
        key={i}
        rowNumber={i + 1}
        stintCount={stintCount}
        guess={isPastGuess ? guesses[i] : null}
        feedback={isPastGuess ? feedback[i] : null}
        currentGuess={isActiveRow ? currentGuess : null}
        lastFeedback={isActiveRow ? lastFeedback : null}
        isActive={isActiveRow}
        isRevealing={isRevealing}
        isShaking={isActiveRow ? isShaking : false}
        openSlotIndex={isActiveRow ? openSlotIndex : null}
        onOpenSlot={onOpenSlot}
        onCloseSlot={onCloseSlot}
        availableTeams={availableTeams}
        onSelectTeam={onSelectTeam}
        onSwap={onSwap}
      />
    );
  }

  return (
    <div
      role="grid"
      aria-label="Guess Board with 6 attempts"
      className="space-y-2 sm:space-y-3"
    >
      {rows}
    </div>
  );
}
