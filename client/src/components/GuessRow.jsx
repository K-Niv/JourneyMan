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

import { motion } from 'framer-motion';
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
  isShaking,
  openSlotIndex,
  onOpenSlot,
  onCloseSlot,
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

  const rowContent = (
    <div
      role="row"
      aria-label={`Guess attempt ${rowNumber} of 6`}
      className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 w-full"
    >
      {/* Row number indicator */}
      <div className="w-5 sm:w-6 shrink-0 text-center" aria-hidden="true">
        <span className="text-[11px] sm:text-xs font-mono text-[#0F0024] font-bold font-poeltl">
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
            const isSlotPickerOpen = openSlotIndex === i;

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
                isPickerOpen={isSlotPickerOpen}
                onOpenPicker={onOpenSlot}
                onClosePicker={onCloseSlot}
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

  // If active row and shaking, wrap in Framer Motion shake container
  if (isActive) {
    return (
      <motion.div
        animate={
          isShaking
            ? { x: [-10, 10, -8, 8, -5, 5, -2, 2, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className="w-full"
      >
        {rowContent}
      </motion.div>
    );
  }

  return rowContent;
}
