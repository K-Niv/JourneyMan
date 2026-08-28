/**
 * client/src/components/GuessRow.jsx
 * =====================================
 * A single horizontal row of SlotTile components.
 *
 * Variants:
 *  - Past guess: tiles show feedback colors, row is non-interactive
 *  - Active guess: tiles are editable/draggable to swap, previous correct tiles locked
 *  - Empty (future): clean empty placeholder tiles
 */

import React from 'react';
import SlotTile from './SlotTile';
import { FEEDBACK } from 'shared';
import { cn } from '@/lib/utils';

export default function GuessRow({
  stintCount,
  guess,
  feedback,
  currentGuess,
  lastFeedback,
  isActive,
  isRevealing,
  availableTeams,
  onSelectTeam,
  onSwap,
  rowNumber,
}) {
  const gapClass =
    stintCount <= 4
      ? 'gap-2 sm:gap-3'
      : stintCount <= 6
      ? 'gap-1.5 sm:gap-2'
      : 'gap-1 sm:gap-1.5';

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
      {/* Row number indicator */}
      <div className="w-5 sm:w-6 shrink-0 text-center">
        <span className="text-[11px] sm:text-xs font-mono text-muted-foreground">
          {rowNumber}
        </span>
      </div>

      {/* Slot tiles */}
      <div
        className={cn('flex-1 grid min-w-0', gapClass)}
        style={{ gridTemplateColumns: `repeat(${stintCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: stintCount }, (_, i) => {
          // Past guess row
          if (guess && feedback) {
            return (
              <SlotTile
                key={i}
                index={i}
                stintCount={stintCount}
                teamId={guess[i]}
                feedback={feedback[i]}
                isLocked={false}
                availableTeams={availableTeams}
                isActive={false}
                isRevealing={isRevealing}
              />
            );
          }

          // Active row (current guess)
          if (isActive && currentGuess) {
            const isLocked = lastFeedback ? lastFeedback[i] === FEEDBACK.CORRECT : false;
            return (
              <SlotTile
                key={i}
                index={i}
                stintCount={stintCount}
                teamId={currentGuess[i]}
                feedback={null}
                isLocked={isLocked}
                availableTeams={availableTeams}
                isActive={true}
                onSelectTeam={onSelectTeam}
                onSwap={onSwap}
              />
            );
          }

          // Empty placeholder row
          return (
            <SlotTile
              key={i}
              index={i}
              stintCount={stintCount}
              teamId={null}
              feedback={null}
              isLocked={false}
              availableTeams={availableTeams}
              isActive={false}
            />
          );
        })}
      </div>
    </div>
  );
}
