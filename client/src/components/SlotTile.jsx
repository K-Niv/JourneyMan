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
  onSelectTeam,
  onSwap,
}) {
  const [open, setOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
    return (
      <div style={{ perspective: 1000 }} className="w-full aspect-square min-w-0">
        <motion.div
          initial={isRevealing ? { rotateX: 90, opacity: 0 } : false}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{
            duration: 0.3,
            delay: isRevealing ? index * 0.1 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn(
            'w-full aspect-square flex flex-col items-center justify-center select-none shadow-md overflow-hidden min-w-0 p-0.5',
            roundedClass,
            borderClass,
            colorClass
          )}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt={team?.abbreviation}
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
        className={cn(
          'relative w-full aspect-square border-emerald-500 bg-emerald-600/90 text-white flex flex-col items-center justify-center shadow-sm ring-1 ring-emerald-400/40 select-none overflow-hidden min-w-0 p-0.5',
          roundedClass,
          borderClass
        )}
        title="Locked: Confirmed correct position"
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
            alt={team?.abbreviation}
            className={cn('object-contain mb-0.5 pointer-events-none shrink-0', logoSizeClass)}
          />
        )}
        <span className={cn('truncate max-w-full text-center', textSizeClass)}>
          {team?.abbreviation ?? '?'}
        </span>
      </div>
    );
  }

  // --- 3. Active row - Unlocked editable slot (with Drag and Drop) ---
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
          onSwap(sourceIndex, index);
        }
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            draggable={!!team}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'w-full aspect-square flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none overflow-hidden min-w-0 p-0.5',
              roundedClass,
              borderClass,
              // Neutral styling when filled before submission (NO yellow border)
              team
                ? 'border-slate-600 bg-slate-800/90 hover:bg-slate-700/80 text-slate-100 cursor-grab active:cursor-grabbing shadow-sm'
                : 'border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-500 text-slate-500',
              isDragOver && 'ring-2 ring-amber-400 border-amber-400 bg-slate-700'
            )}
            aria-label={team ? `Slot ${index + 1}: ${team.name}. Drag to rearrange or click to change.` : `Select team for slot ${index + 1}`}
          >
            {team ? (
              <>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={team.abbreviation}
                    className={cn('object-contain mb-0.5 pointer-events-none shrink-0', logoSizeClass)}
                  />
                )}
                <span className={cn('text-slate-100 truncate max-w-full text-center', textSizeClass)}>
                  {team.abbreviation}
                </span>
              </>
            ) : (
              <span className={cn('font-light text-slate-500', isLargeStint ? 'text-sm sm:text-base' : 'text-lg sm:text-xl')}>+</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-0 border-slate-800 bg-slate-950 shadow-2xl"
          align="center"
          sideOffset={8}
        >
          <TeamSelector
            teams={availableTeams}
            slotIndex={index}
            onSelect={(selectedTeamId) => {
              onSelectTeam(index, selectedTeamId);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // --- 4. Future placeholder row (clean empty box) ---
  return (
    <div
      className={cn(
        'w-full aspect-square border-slate-800/40 bg-slate-900/20 min-w-0',
        roundedClass,
        borderClass
      )}
    />
  );
}
