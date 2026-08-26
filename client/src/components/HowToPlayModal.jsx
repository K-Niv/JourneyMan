/**
 * client/src/components/HowToPlayModal.jsx
 * ==========================================
 * Accessible modal explaining the game rules.
 *
 * Uses shadcn Dialog (Radix). Triggered by the ? button in Header.
 * Contains: objective, feedback color legend, difficulty tiers, and tips.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
      <DialogContent className="max-w-md bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-display bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            How to Play
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Guess the NBA player's career timeline in 6 tries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Objective */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">🏀 Objective</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each puzzle shows an NBA player who has played for multiple teams.
              Fill in the correct order of their career stints — which teams
              they played for, and in what sequence.
            </p>
          </section>

          {/* Rules */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">📋 Rules</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>You have <span className="text-foreground font-medium">6 guesses</span> to figure out the timeline</li>
              <li>Each guess must fill <span className="text-foreground font-medium">every slot</span> with a team</li>
              <li>After each guess, tiles change color to show how close you are</li>
            </ul>
          </section>

          {/* Feedback legend */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">🎨 Feedback Colors</h3>
            <div className="space-y-3">
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
                color="bg-slate-700"
                label="NYK"
                description="This team is not in the player's timeline"
              />
            </div>
          </section>

          {/* Difficulty */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">📊 Difficulty</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">🟢</span>
                <span className="text-muted-foreground">Easy (2 teams)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">🟡</span>
                <span className="text-muted-foreground">Medium (3 teams)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">🔴</span>
                <span className="text-muted-foreground">Hard (4-5 teams)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">💀</span>
                <span className="text-muted-foreground">Expert (6+ teams)</span>
              </div>
            </div>
          </section>

          {/* New puzzle */}
          <p className="text-xs text-center text-muted-foreground pt-2 border-t border-slate-800">
            A new puzzle is available every day at midnight UTC 🌍
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
