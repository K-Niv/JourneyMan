/**
 * client/src/components/TeamCard.jsx
 * ====================================
 * Individual team option rendered inside the TeamSelector's command list.
 * Shows team logo, full name, and abbreviation.
 */

import { CommandItem } from '@/components/ui/command';
import { getTeamLogo } from '@/data/teamLogos';

export default function TeamCard({ team, onSelect }) {
  const logoUrl = getTeamLogo(team.abbreviation);

  return (
    <CommandItem
      value={`${team.name} ${team.abbreviation}`}
      onSelect={() => onSelect(team)}
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
    >
      {/* Team logo */}
      <div className="w-8 h-8 shrink-0 flex items-center justify-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={team.abbreviation}
            className="w-7 h-7 object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400">
              {team.abbreviation}
            </span>
          </div>
        )}
      </div>

      {/* Team name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {team.name}
        </p>
      </div>

      {/* Abbreviation badge */}
      <span className="text-[10px] font-bold text-muted-foreground bg-slate-800 px-2 py-0.5 rounded">
        {team.abbreviation}
      </span>
    </CommandItem>
  );
}
