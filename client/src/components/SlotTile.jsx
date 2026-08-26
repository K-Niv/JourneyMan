/**
 * client/src/components/SlotTile.jsx
 * ====================================
 * Individual guess slot tile with drag-and-drop reordering, neutral unsubmitted
 * styling, and locked state for previously correct stints.
 *
 * States:
 * 1. Feedback (past row) — color-coded (green/amber/gray), non-interactive
 * 2. Locked (active row) — green background with lock icon, preserved from prior correct guess
 * 3. Filled (active row) — neutral styling (no yellow border), draggable to swap, clickable to change
 * 4. Empty (active row) — dashed border with + icon, clickable to pick, drop target
 * 5. Future (inactive row) — subtle empty box (no stint text)
 */

import React, { useState } from 'react';
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
  [FEEDBACK.INCORRECT]: 'bg-slate-700 border-slate-600 text-slate-300',
};

export default function SlotTile({
  index,
  teamId,
  feedback,
  isLocked,
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

  // --- 1. Past guess row (feedback state) ---
  if (feedback) {
    const colorClass = FEEDBACK_COLORS[feedback] ?? FEEDBACK_COLORS[FEEDBACK.INCORRECT];
    return (
      <div
        className={cn(
          'w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 select-none',
          colorClass
        )}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt={team?.abbreviation}
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain mb-0.5 opacity-95 pointer-events-none"
          />
        )}
        <span className="text-xs sm:text-sm font-bold">
          {team?.abbreviation ?? '?'}
        </span>
      </div>
    );
  }

  // --- 2. Active row - Locked slot (confirmed correct on prior guess) ---
  if (isActive && isLocked) {
    return (
      <div
        className="relative w-full aspect-square rounded-xl border-2 border-emerald-500 bg-emerald-600/90 text-white flex flex-col items-center justify-center shadow-sm ring-1 ring-emerald-400/40 select-none"
        title="Locked: Confirmed correct position"
      >
        <div className="absolute top-1.5 right-1.5 p-0.5 bg-emerald-800/80 rounded-full">
          <Lock className="w-2.5 h-2.5 text-emerald-100" />
        </div>
        {logoUrl && (
          <img
            src={logoUrl}
            alt={team?.abbreviation}
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain mb-0.5 pointer-events-none"
          />
        )}
        <span className="text-xs sm:text-sm font-bold">
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
              'w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none',
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
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain mb-0.5 pointer-events-none"
                  />
                )}
                <span className="text-xs sm:text-sm font-bold text-slate-100">
                  {team.abbreviation}
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-light text-slate-500">+</span>
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

  // --- 4. Future placeholder row (clean empty box, no stint text) ---
  return (
    <div className="w-full aspect-square rounded-xl border-2 border-slate-800/40 bg-slate-900/20" />
  );
}
