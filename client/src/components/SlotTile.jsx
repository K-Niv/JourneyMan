/**
 * client/src/components/SlotTile.jsx
 * ====================================
 * Individual guess slot tile with drag-and-drop reordering, neutral unsubmitted
 * styling, locked state for previously correct stints, and responsive scaling.
 *
 * States:
 * 1. Feedback (past row) — color-coded (green/amber/red), non-interactive, animated reveal
 * 2. Locked (active row) — green background with lock icon, preserved from prior correct guess
 * 3. Filled (active row) — neutral styling (no yellow border), draggable to swap, clickable to change
 * 4. Empty (active row) — dashed border with + icon, clickable to pick, drop target
 * 5. Future (inactive row) — subtle empty box
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import TeamSelector from './TeamSelector';
import { getTeamLogo } from '@/data/teamLogos';
import { FEEDBACK } from 'shared';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

/**
 * Background colors for each feedback type.
 */
const FEEDBACK_COLORS = {
  [FEEDBACK.CORRECT]: 'bg-emerald-500 border-emerald-400 text-white',
  [FEEDBACK.MISPLACED]: 'bg-amber-500 border-amber-400 text-white',
  [FEEDBACK.INCORRECT]: 'bg-red-600 border-red-500 text-white',
};

export default function SlotTile({
  index,
  stintCount = 4,
  teamId,
  feedback,
  isLocked,
  isRevealing,
  availableTeams,
  isActive,
  isPickerOpen,
  onOpenPicker,
  onClosePicker,
  onSelectTeam,
  onSwap,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Controlled vs uncontrolled popover open state
  const isPopoverOpen = isPickerOpen !== undefined ? isPickerOpen : internalOpen;
  const handleOpenChange = (newOpen) => {
    if (newOpen) {
      onOpenPicker ? onOpenPicker(index) : setInternalOpen(true);
    } else {
      onClosePicker ? onClosePicker() : setInternalOpen(false);
    }
  };

  // Find the team object for display
  const team = teamId
    ? availableTeams.find((t) => t.id === teamId)
    : null;

  const logoUrl = team ? getTeamLogo(team.abbreviation) : null;

  // Dynamic responsive typography & sizing based on stint count
  const isLargeStint = stintCount >= 7;
  const isMediumStint = stintCount >= 5 && stintCount < 7;

  const roundedClass = isLargeStint ? 'rounded-lg' : 'rounded-xl';
  const borderClass = isLargeStint ? 'border' : 'border-2';
  const logoSizeClass = isLargeStint
    ? 'w-3.5 h-3.5 sm:w-4.5 sm:h-4.5'
    : isMediumStint
    ? 'w-4.5 h-4.5 sm:w-5.5 sm:h-5.5'
    : 'w-6 h-6 sm:w-7 sm:h-7';
  const textSizeClass = isLargeStint
    ? 'text-[8px] sm:text-[10px] font-bold leading-none tracking-tighter'
    : isMediumStint
    ? 'text-[10px] sm:text-xs font-bold leading-tight'
    : 'text-xs sm:text-sm font-bold';

  // --- 1. Past guess row (feedback state) ---
  if (feedback) {
    const colorClass = FEEDBACK_COLORS[feedback] ?? FEEDBACK_COLORS[FEEDBACK.INCORRECT];
    const feedbackDescription =
      feedback === FEEDBACK.CORRECT
        ? 'correct'
        : feedback === FEEDBACK.MISPLACED
        ? 'misplaced (wrong position)'
        : 'incorrect (not in timeline)';

    return (
      <div style={{ perspective: 1000 }} className="w-full aspect-square min-w-0">
        <motion.div
          role="gridcell"
          aria-roledescription="graded stint slot"
          aria-label={`Slot ${index + 1}: ${team?.name || 'Unknown'} (${team?.abbreviation || '?'}), ${feedbackDescription}`}
          initial={isRevealing ? { rotateX: 90, opacity: 0 } : false}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{
            duration: 0.3,
            delay: isRevealing ? index * 0.1 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn(
            'w-full aspect-square flex flex-col items-center justify-center select-none shadow-md overflow-hidden min-w-0 p-0.5 focus:outline-none',
            roundedClass,
            borderClass,
            colorClass
          )}
          tabIndex={0}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              aria-hidden="true"
              className={cn('object-contain mb-0.5 opacity-95 pointer-events-none shrink-0', logoSizeClass)}
            />
          )}
          <span className={cn('truncate max-w-full text-center', textSizeClass)}>
            {team?.abbreviation ?? '?'}
          </span>
        </motion.div>
      </div>
    );
  }

  // --- 2. Active row - Locked slot (confirmed correct on prior guess) ---
  if (isActive && isLocked) {
    return (
      <div
        role="gridcell"
        aria-roledescription="locked career stint slot"
        aria-label={`Slot ${index + 1}: ${team?.name || 'Unknown'} (${team?.abbreviation || '?'}), confirmed correct and locked`}
        className={cn(
          'relative w-full aspect-square border-emerald-500 bg-emerald-600/90 text-white flex flex-col items-center justify-center shadow-sm ring-1 ring-emerald-400/40 select-none overflow-hidden min-w-0 p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
          roundedClass,
          borderClass
        )}
        title="Locked: Confirmed correct position"
        tabIndex={0}
      >
        <div
          className={cn(
            'absolute bg-emerald-800/80 rounded-full',
            isLargeStint ? 'top-0.5 right-0.5 p-0.5' : 'top-1 right-1 p-0.5'
          )}
        >
          <Lock className={cn('text-emerald-100', isLargeStint ? 'w-2 h-2' : 'w-2.5 h-2.5')} />
        </div>
        {logoUrl && (
          <img
            src={logoUrl}
            alt=""
            aria-hidden="true"
            className={cn('object-contain mb-0.5 pointer-events-none shrink-0', logoSizeClass)}
          />
        )}
        <span className={cn('truncate max-w-full text-center', textSizeClass)}>
          {team?.abbreviation ?? '?'}
        </span>
      </div>
    );
  }

  // --- 3. Active row - Unlocked editable slot (with Drag and Drop & Keyboard Control) ---
  if (isActive) {
    const handleDragStart = (e) => {
      e.dataTransfer.setData('text/plain', index.toString());
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const sourceIndexStr = e.dataTransfer.getData('text/plain');
      if (sourceIndexStr !== '') {
        const sourceIndex = parseInt(sourceIndexStr, 10);
        if (!isNaN(sourceIndex) && sourceIndex !== index && onSwap) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(15);
          }
          onSwap(sourceIndex, index);
        }
      }
    };

    return (
      <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={`slot-tile-${index}`}
            draggable={!!team}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'w-full aspect-square flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none overflow-hidden min-w-0 p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-95',
              roundedClass,
              borderClass,
              team
                ? 'border-slate-600 bg-slate-800/90 hover:bg-slate-700/80 text-slate-100 cursor-grab active:cursor-grabbing shadow-sm'
                : 'border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-500 text-slate-500',
              isDragOver && 'ring-2 ring-amber-400 border-amber-400 bg-slate-700'
            )}
            aria-roledescription="career stint slot"
            aria-label={
              team
                ? `Slot ${index + 1}: ${team.name} (${team.abbreviation}). Press ${index + 1} or click to change, drag to rearrange.`
                : `Slot ${index + 1}: Empty. Press ${index + 1} or click to select a team.`
            }
          >
            {team ? (
              <motion.div
                key={team.id}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full h-full flex flex-col items-center justify-center min-w-0"
              >
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt=""
                    aria-hidden="true"
                    className={cn('object-contain mb-0.5 pointer-events-none shrink-0', logoSizeClass)}
                  />
                )}
                <span className={cn('text-slate-100 truncate max-w-full text-center', textSizeClass)}>
                  {team.abbreviation}
                </span>
              </motion.div>
            ) : (
              <span className={cn('font-light text-slate-500', isLargeStint ? 'text-sm sm:text-base' : 'text-lg sm:text-xl')}>+</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 sm:w-80 p-0 border-slate-800 bg-slate-950 shadow-2xl z-50"
          align="center"
          sideOffset={8}
        >
          <TeamSelector
            teams={availableTeams}
            slotIndex={index}
            onSelect={(selectedTeamId) => {
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(12);
              }
              onSelectTeam(index, selectedTeamId);
              handleOpenChange(false);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // --- 4. Future placeholder row (clean empty box) ---
  return (
    <div
      role="gridcell"
      aria-label={`Slot ${index + 1}: Upcoming attempt placeholder`}
      className={cn(
        'w-full aspect-square border-slate-800/40 bg-slate-900/20 min-w-0',
        roundedClass,
        borderClass
      )}
    />
  );
}
