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
      className="rounded-none border-2 border-[#0F0024] bg-white text-[#212121] shadow-brutal overflow-hidden font-sans"
      aria-label={`Select team for slot ${(slotIndex ?? 0) + 1}`}
    >
      <div className="border-b-2 border-[#0F0024] bg-[#F5ECDF]">
        <CommandInput
          placeholder="Search 30 NBA teams…"
          className="text-[#0F0024] text-sm h-11 font-sans placeholder:text-[#5A5A5A]"
          autoFocus
        />
      </div>
      <CommandList className="max-h-64 sm:max-h-72 overflow-y-auto p-1.5">
        <CommandEmpty className="text-[#5A5A5A] text-xs py-6 text-center font-bold">
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
                className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] cursor-pointer rounded-none hover:bg-[#DAAE4F]/20 active:bg-[#DAAE4F]/30 transition-colors border-b border-[#0F0024]/10 last:border-b-0"
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
                    <div className="w-6 h-6 rounded-none bg-[#F5ECDF] border border-[#0F0024] flex items-center justify-center">
                      <span className="text-[8px] font-bold text-[#0F0024]">
                        {team.abbreviation}
                      </span>
                    </div>
                  )}
                </div>

                {/* Team name */}
                <span className="flex-1 text-sm font-bold text-[#0F0024] truncate font-poeltl">
                  {team.name}
                </span>

                {/* Abbreviation badge */}
                <span className="text-[10px] font-bold text-[#0F0024] bg-[#DAAE4F]/30 border border-[#0F0024] px-2 py-0.5 rounded-none font-mono">
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
