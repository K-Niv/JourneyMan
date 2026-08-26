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

export default function TeamSelector({ teams, onSelect, slotIndex }) {
  return (
    <Command className="rounded-lg border border-slate-800 bg-slate-950">
      <CommandInput
        placeholder="Search teams…"
        className="text-foreground"
        autoFocus
      />
      <CommandList>
        <CommandEmpty className="text-muted-foreground">
          No teams found.
        </CommandEmpty>
        <CommandGroup>
          {teams.map((team) => {
            const logoUrl = getTeamLogo(team.abbreviation);
            return (
              <CommandItem
                key={team.id}
                value={`${team.name} ${team.abbreviation}`}
                onSelect={() => onSelect(team.id)}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
              >
                {/* Team logo */}
                <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={team.abbreviation}
                      className="w-6 h-6 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
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

                {/* Abbreviation */}
                <span className="text-[10px] font-bold text-muted-foreground bg-slate-800 px-2 py-0.5 rounded">
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
