/**
 * client/src/components/Header.jsx
 * ==================================
 * Compact top bar for the JourneyMan game.
 *
 * Layout: [? Help]  ──  JourneyMan Title  ──  [📅 Calendar]
 *
 * The ? button opens the HowToPlayModal.
 * The Calendar icon is a non-functional placeholder for PR10's history view.
 */

import React, { useState } from 'react';
import { HelpCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import HowToPlayModal from './HowToPlayModal';

export default function Header({ puzzleNumber, puzzleDate }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <TooltipProvider delayDuration={300}>
      <header className="w-full max-w-lg mx-auto flex items-center justify-between px-2 py-3">
        {/* Left — Help button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="help-button"
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => setShowHelp(true)}
              aria-label="How to play"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>How to Play</p>
          </TooltipContent>
        </Tooltip>

        {/* Center — Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            JourneyMan
          </h1>
          {puzzleNumber && (
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
              Puzzle #{puzzleNumber} · {puzzleDate}
            </p>
          )}
        </div>

        {/* Right — Calendar icon (placeholder for PR10) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="calendar-button"
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
              aria-label="History (coming soon)"
              disabled
            >
              <Calendar className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>History — Coming Soon</p>
          </TooltipContent>
        </Tooltip>
      </header>

      {/* How to Play Modal */}
      <HowToPlayModal open={showHelp} onOpenChange={setShowHelp} />
    </TooltipProvider>
  );
}
