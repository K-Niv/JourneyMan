/**
 * client/src/components/LandingPage.jsx
 * ======================================
 * Modern, high-contrast landing page matching the Poeltl brand identity system.
 * Includes Hero with CTA.
 */

import { useState } from 'react';
import {
  Play,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export default function LandingPage({
  onPlay,
  onOpenHelp,
  onOpenAuth,
  puzzleNumber = 1,
  puzzleDate = 'Today',
}) {
  const [activePreviewIndex, setActivePreviewIndex] = useState(1);

  // Sample timeline demonstration for the Hero interactive preview
  const demoStints = [
    {
      team: 'CLE',
      name: 'Cavaliers',
      years: '2003–10',
      status: 'correct',
      badge: 'Exact Stint',
      color: 'bg-emerald-600 text-white border-[#0F0024]',
    },
    {
      team: 'MIA',
      name: 'Heat',
      years: '2010–14',
      status: 'correct',
      badge: 'Exact Stint',
      color: 'bg-emerald-600 text-white border-[#0F0024]',
    },
    {
      team: 'LAL',
      name: 'Lakers',
      years: '2018–2026',
      status: 'misplaced',
      badge: 'Misplaced Stint',
      color: 'bg-[#DAAE4F] text-[#0F0024] border-[#0F0024]',
    },
    {
      team: 'TOR',
      name: 'Raptors',
      years: 'Never',
      status: 'incorrect',
      badge: 'Wrong Team',
      color: 'bg-red-600 text-white border-[#0F0024]',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="w-full max-w-5xl px-4 pt-4 pb-12 sm:pt-8 sm:pb-16 flex flex-col items-center text-center">
        {/* Kicker Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#DAAE4F]/25 border border-[#DAAE4F] text-[#0F0024] font-bold text-xs sm:text-sm tracking-widest uppercase mb-4 shadow-brutal-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#0F0024]" />
          <span>DAILY NBA TIMELINE PUZZLE #{puzzleNumber} · {puzzleDate}</span>
        </div>

        {/* Display Headline (H2: 40px) */}
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#0F0024] tracking-tight leading-[1.1] max-w-3xl mb-4 font-poeltl">
          GUESS THE NBA CAREER TIMELINE
        </h2>

        {/* Subheading (Body: 18px) */}
        <p className="text-base sm:text-lg text-[#5A5A5A] max-w-2xl mb-8 leading-relaxed">
          Put your hoop memory to the test. Arrange mystery player career stints across NBA franchises with daily clues, color-coded feedback, and instant validation.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-10">
          <Button
            id="hero-play-button"
            size="lg"
            variant="primary"
            className="w-full sm:w-auto text-base px-8 py-3.5 shadow-brutal text-[#0F0024] font-extrabold uppercase tracking-wide hover:shadow-brutal-lg transition-all"
            onClick={onPlay}
          >
            <Play className="w-5 h-5 mr-2 fill-[#0F0024]" />
            Play Today's Puzzle
          </Button>

          <Button
            id="hero-rules-button"
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto text-base px-6 py-3.5 shadow-brutal-sm text-[#0F0024] font-bold tracking-wide"
            onClick={onOpenHelp}
          >
            <HelpCircle className="w-5 h-5 mr-2 text-[#0F0024]" />
            How to Play
          </Button>
        </div>

        {/* Interactive Visual Preview Card */}
        <div className="w-full max-w-2xl bg-white border-2 border-[#0F0024] p-4 sm:p-6 shadow-brutal text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b-2 border-[#0F0024] mb-4 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#DAAE4F] border border-[#0F0024] inline-block" />
                <h3 className="font-poeltl font-bold text-sm sm:text-base text-[#0F0024] uppercase tracking-wider">
                  Live Puzzle Preview: LeBron James (4 Stints)
                </h3>
              </div>
            </div>
            <Badge variant="gold" className="text-[11px] font-bold">
              GUESS 1 / 6
            </Badge>
          </div>

          {/* Demonstration Stints Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {demoStints.map((stint, idx) => (
              <div
                key={idx}
                onClick={() => setActivePreviewIndex(idx)}
                className={cn(
                  'border-2 p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-150 relative select-none',
                  stint.color,
                  activePreviewIndex === idx ? 'scale-105 shadow-brutal-sm ring-2 ring-[#0F0024]' : 'opacity-90 hover:opacity-100'
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">
                  Slot #{idx + 1}
                </span>
                <span className="text-xl font-extrabold font-poeltl">{stint.team}</span>
                <span className="text-xs font-semibold">{stint.name}</span>
                <span className="text-[10px] font-mono mt-1 opacity-90">{stint.years}</span>
                <div className="mt-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#0F0024]/10 rounded-[1px]">
                  {stint.badge}
                </div>
              </div>
            ))}
          </div>

          {/* Feedback Explanation Banner */}
          <div className="bg-[#F5ECDF] border-2 border-[#0F0024] p-3 text-xs flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-600 border border-[#0F0024]" />
              <span className="font-bold text-[#0F0024]">Green</span> = Exact
              <span className="w-2.5 h-2.5 bg-[#DAAE4F] border border-[#0F0024] ml-1.5" />
              <span className="font-bold text-[#0F0024]">Gold</span> = Misplaced
              <span className="w-2.5 h-2.5 bg-red-600 border border-[#0F0024] ml-1.5" />
              <span className="font-bold text-[#0F0024]">Red</span> = Wrong Team
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
