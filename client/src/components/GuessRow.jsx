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

export default function GuessRow({
  stintCount,
  guess,
  feedback,
  currentGuess,
  lastFeedback,
  isActive,
  availableTeams,
  onSelectTeam,
  onSwap,
  rowNumber,
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Row number indicator */}
      <div className="w-6 shrink-0 text-center">
        <span className="text-xs font-mono text-muted-foreground">
          {rowNumber}
        </span>
      </div>

      {/* Slot tiles */}
      <div className="flex-1 grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${stintCount}, 1fr)` }}>
        {Array.from({ length: stintCount }, (_, i) => {
          // Past guess row
          if (guess && feedback) {
            return (
              <SlotTile
                key={i}
                index={i}
                teamId={guess[i]}
                feedback={feedback[i]}
                isLocked={false}
                availableTeams={availableTeams}
                isActive={false}
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
