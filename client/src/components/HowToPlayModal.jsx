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
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${color}`}
      >
        {label}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function HowToPlayModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md bg-slate-950/95 border-slate-800 text-slate-100 p-5 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-xl max-h-[85vh] sm:max-h-[80vh] flex flex-col gap-3 overflow-hidden">
        <DialogHeader className="shrink-0 text-left pr-6">
          <DialogTitle className="text-xl sm:text-2xl font-display bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent font-extrabold">
            How to Play
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Guess the NBA player&apos;s career timeline in 6 tries.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Objective */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <span>🏀</span> Objective
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Each puzzle shows an NBA player who has played for multiple teams.
              Fill in the correct order of their career stints — which teams
              they played for, and in what sequence.
            </p>
          </section>

          {/* Rules */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
              <span>📋</span> Rules
            </h3>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>You have <span className="text-foreground font-medium">6 guesses</span> to figure out the timeline</li>
              <li>Each guess must fill <span className="text-foreground font-medium">every slot</span> with a team</li>
              <li>After each guess, tiles change color to show how close you are</li>
            </ul>
          </section>

          {/* Feedback legend */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span>🎨</span> Feedback Colors
            </h3>
            <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              <LegendTile
                color="bg-emerald-500"
                label="LAL"
                description="Correct team in the correct position"
              />
              <LegendTile
                color="bg-amber-500"
                label="BOS"
                description="This team is in the timeline, but in the wrong position"
              />
              <LegendTile
                color="bg-red-600"
                label="NYK"
                description="This team is not in the player's timeline"
              />
            </div>
          </section>

          {/* Difficulty */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span>📊</span> Difficulty
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <span className="text-emerald-400">🟢</span>
                <span className="text-muted-foreground font-medium">Easy (2 teams)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <span className="text-yellow-400">🟡</span>
                <span className="text-muted-foreground font-medium">Medium (3 teams)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <span className="text-red-400">🔴</span>
                <span className="text-muted-foreground font-medium">Hard (4-5 teams)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <span className="text-purple-400">💀</span>
                <span className="text-muted-foreground font-medium">Expert (6+ teams)</span>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span>⌨️</span> Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-400 font-bold">1–9</kbd>
                <span className="text-muted-foreground">Select slot</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-400 font-bold">Enter</kbd>
                <span className="text-muted-foreground">Submit guess</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-400 font-bold">Backspace</kbd>
                <span className="text-muted-foreground">Clear last slot</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-400 font-bold">C</kbd>
                <span className="text-muted-foreground">Clear row</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-400 font-bold">H</kbd>
                <span className="text-muted-foreground">History & stats</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-400 font-bold">?</kbd>
                <span className="text-muted-foreground">Rules & help</span>
              </div>
            </div>
          </section>

          {/* New puzzle */}
          <p className="text-[11px] text-center text-muted-foreground pt-3 border-t border-slate-800/80">
            A new puzzle is available every day at midnight UTC 🌍
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 pt-2 border-t border-slate-800/60">
          <Button
            variant="outline"
            className="w-full border-slate-800 hover:bg-slate-900 text-slate-200 font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Got it, let&apos;s play!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
