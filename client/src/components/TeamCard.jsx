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
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-none hover:bg-[#DAAE4F]/20 active:bg-[#DAAE4F]/30 border-b border-[#0F0024]/10 last:border-b-0"
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
          <div className="w-7 h-7 rounded-none bg-[#F5ECDF] border border-[#0F0024] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#0F0024]">
              {team.abbreviation}
            </span>
          </div>
        )}
      </div>

      {/* Team name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#0F0024] truncate font-poeltl">
          {team.name}
        </p>
      </div>

      {/* Abbreviation badge */}
      <span className="text-[10px] font-bold text-[#0F0024] bg-[#DAAE4F]/30 border border-[#0F0024] px-2 py-0.5 rounded-none font-mono">
        {team.abbreviation}
      </span>
    </CommandItem>
  );
}
