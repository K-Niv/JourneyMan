/**
 * client/src/components/AnswerTimeline.jsx
 * ==========================================
 * Vertical chronological timeline showing the career journey of the player.
 *
 * Rendered within the GameOverModal upon puzzle completion (win or loss).
 */

import { getTeamLogo } from '@/data/teamLogos';

export default function AnswerTimeline({ answer }) {
  if (!answer || !Array.isArray(answer) || answer.length === 0) {
    return null;
  }

  // Ensure answer is sorted by stintOrder
  const sortedStints = [...answer].sort((a, b) => a.stintOrder - b.stintOrder);

  return (
    <div className="rounded-none border-2 border-[#0F0024] bg-[#F5ECDF] p-4 shadow-brutal-sm font-sans">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F0024] mb-3 flex items-center gap-1.5 font-poeltl">
        <span>📍</span> Career Timeline
      </h4>

      <div className="max-h-48 sm:max-h-56 overflow-y-auto pr-2">
        <div className="relative pl-6 space-y-3.5 my-1">
          {/* Vertical connecting line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-[#0F0024]/40" />

          {sortedStints.map((stint, idx) => {
            const logoUrl = getTeamLogo(stint.abbreviation);
            const yearsLabel =
              stint.startYear === stint.endYear
                ? `${stint.startYear}`
                : `${stint.startYear} – ${stint.endYear}`;

            return (
              <div key={stint.stintOrder || idx} className="relative flex items-center justify-between gap-3">
                {/* Step circle marker */}
                <div className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-none bg-[#DAAE4F] border-2 border-[#0F0024] text-[11px] font-extrabold text-[#0F0024] font-poeltl shadow-brutal-sm">
                  {stint.stintOrder}
                </div>

                {/* Team details */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 ml-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={stint.abbreviation}
                      className="w-7 h-7 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 border border-[#0F0024] bg-white flex items-center justify-center text-xs shrink-0">
                      🏀
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F0024] truncate font-poeltl">
                      {stint.teamName || stint.abbreviation}
                    </p>
                    <p className="text-xs text-[#5A5A5A] font-semibold">
                      {stint.abbreviation}
                    </p>
                  </div>
                </div>

                {/* Years badge */}
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-none bg-white px-2 py-0.5 text-xs font-mono font-bold text-[#0F0024] border border-[#0F0024] shadow-brutal-sm">
                    {yearsLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
