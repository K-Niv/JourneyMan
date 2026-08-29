/**
 * client/src/components/TeamSelector.jsx
 * ========================================
 * Searchable team picker using shadcn Command + Popover.
 *
 * Renders inside a Popover anchored to a SlotTile.
 * Features:
 *  - Text search filtering by team name or abbreviation
 *  - Keyboard navigation (arrow keys, Enter, Escape)
 *  - Accessible ARIA labels
 *  - Closes on selection, calling onSelect(teamId)
 */

import React from 'react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { getTeamLogo } from '@/data/teamLogos';

export default function TeamSelector({ teams = [], onSelect, slotIndex }) {
  return (
    <Command
      className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden"
      aria-label={`Select team for slot ${(slotIndex ?? 0) + 1}`}
    >
      <div className="border-b border-slate-800/80">
        <CommandInput
          placeholder="Search 30 NBA teams…"
          className="text-foreground text-sm h-11"
          autoFocus
        />
      </div>
      <CommandList className="max-h-64 sm:max-h-72 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        <CommandEmpty className="text-muted-foreground text-xs py-6 text-center">
          No matching NBA team found.
        </CommandEmpty>
        <CommandGroup>
          {teams.map((team) => {
            const logoUrl = getTeamLogo(team.abbreviation);
            return (
              <CommandItem
                key={team.id}
                value={`${team.name} ${team.abbreviation}`}
                onSelect={() => onSelect(team.id)}
                className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] cursor-pointer rounded-lg hover:bg-slate-900 active:bg-slate-800 transition-colors"
                role="option"
                aria-label={`${team.name} (${team.abbreviation})`}
              >
                {/* Team logo */}
                <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-6 h-6 object-contain pointer-events-none"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-slate-400">
                        {team.abbreviation}
                      </span>
                    </div>
                  )}
                </div>

                {/* Team name */}
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {team.name}
                </span>

                {/* Abbreviation badge */}
                <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                  {team.abbreviation}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
