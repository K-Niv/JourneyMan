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
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
        <span>📍</span> Career Timeline
      </h4>

      <div className="max-h-48 sm:max-h-56 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:theme(colors.slate.700)_transparent]">
        <div className="relative pl-6 space-y-3.5 my-1">
          {/* Vertical connecting line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-800" />

          {sortedStints.map((stint, idx) => {
            const logoUrl = getTeamLogo(stint.abbreviation);
            const yearsLabel =
              stint.startYear === stint.endYear
                ? `${stint.startYear}`
                : `${stint.startYear} – ${stint.endYear}`;

            return (
              <div key={stint.stintOrder || idx} className="relative flex items-center justify-between gap-3">
                {/* Step circle marker */}
                <div className="absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 text-[11px] font-bold text-amber-400">
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
                    <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-xs shrink-0">
                      🏀
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {stint.teamName || stint.abbreviation}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stint.abbreviation}
                    </p>
                  </div>
                </div>

                {/* Years badge */}
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-md bg-slate-800/80 px-2 py-0.5 text-xs font-mono font-medium text-slate-300 border border-slate-700/50">
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
