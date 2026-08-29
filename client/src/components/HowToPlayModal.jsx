/**
 * client/src/components/HowToPlayModal.jsx
 * ==========================================
 * Accessible modal explaining the game rules.
 *
 * Uses shadcn Dialog (Radix). Triggered by the ? button in Header.
 * Contains: objective, feedback color legend, difficulty tiers, and tips.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Example feedback tile for the legend.
 */
function LegendTile({ color, label, description }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 border-2 border-[#0F0024] flex items-center justify-center text-xs font-bold shrink-0 ${color}`}
      >
        {label}
      </div>
      <p className="text-sm text-[#5A5A5A] leading-tight font-medium">{description}</p>
    </div>
  );
}

export default function HowToPlayModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md bg-white border-2 border-[#0F0024] text-[#212121] p-5 sm:p-6 rounded-none shadow-brutal max-h-[85vh] sm:max-h-[80vh] flex flex-col gap-3 overflow-hidden font-sans">
        <DialogHeader className="shrink-0 text-left pr-6">
          <DialogTitle className="text-xl sm:text-2xl font-extrabold text-[#0F0024] font-poeltl uppercase tracking-wide">
            How to Play
          </DialogTitle>
          <DialogDescription className="text-xs text-[#5A5A5A]">
            Guess the NBA player&apos;s career timeline in 6 tries.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4">
          {/* Objective */}
          <section>
            <h3 className="text-sm font-bold text-[#0F0024] mb-1.5 flex items-center gap-1.5 font-poeltl uppercase">
              <span>🏀</span> Objective
            </h3>
            <p className="text-xs sm:text-sm text-[#5A5A5A] leading-relaxed">
              Each puzzle shows an NBA player who has played for multiple teams.
              Fill in the correct order of their career stints — which teams
              they played for, and in what sequence.
            </p>
          </section>

          {/* Rules */}
          <section>
            <h3 className="text-sm font-bold text-[#0F0024] mb-1.5 flex items-center gap-1.5 font-poeltl uppercase">
              <span>📋</span> Rules
            </h3>
            <ul className="text-xs sm:text-sm text-[#5A5A5A] space-y-1.5 list-disc list-inside font-medium">
              <li>You have <span className="text-[#0F0024] font-bold">6 guesses</span> to figure out the timeline</li>
              <li>Each guess must fill <span className="text-[#0F0024] font-bold">every slot</span> with a team</li>
              <li>After each guess, tiles change color to show how close you are</li>
            </ul>
          </section>

          {/* Feedback legend */}
          <section>
            <h3 className="text-sm font-bold text-[#0F0024] mb-2 flex items-center gap-1.5 font-poeltl uppercase">
              <span>🎨</span> Feedback Colors
            </h3>
            <div className="space-y-2.5 bg-[#F5ECDF] p-3 border-2 border-[#0F0024] shadow-brutal-sm">
              <LegendTile
                color="bg-emerald-600 text-white shadow-brutal-sm"
                label="LAL"
                description="Correct team in the correct chronological position"
              />
              <LegendTile
                color="bg-[#DAAE4F] text-[#0F0024] font-extrabold shadow-brutal-sm"
                label="BOS"
                description="This team is in the timeline, but in a different position"
              />
              <LegendTile
                color="bg-red-600 text-white shadow-brutal-sm"
                label="NYK"
                description="This team is not in the player's career timeline"
              />
            </div>
          </section>

          {/* Difficulty */}
          <section>
            <h3 className="text-sm font-bold text-[#0F0024] mb-2 flex items-center gap-1.5 font-poeltl uppercase">
              <span>📊</span> Difficulty
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <span>🟢</span>
                <span className="text-[#0F0024] font-bold">Easy (2 teams)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <span>🟡</span>
                <span className="text-[#0F0024] font-bold">Medium (3 teams)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <span>🔴</span>
                <span className="text-[#0F0024] font-bold">Hard (4-5 teams)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <span>💀</span>
                <span className="text-[#0F0024] font-bold">Expert (6+ teams)</span>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-sm font-bold text-[#0F0024] mb-2 flex items-center gap-1.5 font-poeltl uppercase">
              <span>⌨️</span> Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#0F0024] font-mono text-[#0F0024] font-bold shadow-brutal-sm">1–9</kbd>
                <span className="text-[#5A5A5A] font-semibold">Select slot</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#0F0024] font-mono text-[#0F0024] font-bold shadow-brutal-sm">Enter</kbd>
                <span className="text-[#5A5A5A] font-semibold">Submit guess</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#0F0024] font-mono text-[#0F0024] font-bold shadow-brutal-sm">Backspace</kbd>
                <span className="text-[#5A5A5A] font-semibold">Clear last slot</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#0F0024] font-mono text-[#0F0024] font-bold shadow-brutal-sm">C</kbd>
                <span className="text-[#5A5A5A] font-semibold">Clear row</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#0F0024] font-mono text-[#0F0024] font-bold shadow-brutal-sm">H</kbd>
                <span className="text-[#5A5A5A] font-semibold">History & stats</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#F5ECDF] border border-[#0F0024]">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#0F0024] font-mono text-[#0F0024] font-bold shadow-brutal-sm">?</kbd>
                <span className="text-[#5A5A5A] font-semibold">Rules & help</span>
              </div>
            </div>
          </section>

          {/* New puzzle */}
          <p className="text-[11px] text-center text-[#5A5A5A] pt-3 border-t border-[#0F0024]/15 font-semibold">
            A new puzzle is available every day at midnight UTC 🌍
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 pt-2 border-t border-[#0F0024]/20">
          <Button
            variant="primary"
            className="w-full bg-[#DAAE4F] text-[#0F0024] font-extrabold shadow-brutal hover:shadow-brutal-lg"
            onClick={() => onOpenChange(false)}
          >
            Got it, let&apos;s play!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
