/**
 * client/src/App.jsx
 * ===================
 * Root application component.
 *
 * PR 05: Wires up the Zustand stores and puzzle loader hook, rendering a
 * temporary debug view that proves the state pipeline works end-to-end.
 * PR 06 will replace this with the actual game board UI.
 */

import React from 'react';
import { usePuzzleLoader } from './hooks/usePuzzleLoader.js';
import { useGameStore } from './stores/gameStore.js';
import { useAuthStore } from './stores/authStore.js';
import { MAX_ATTEMPTS, DIFFICULTY } from 'shared';

// ---------------------------------------------------------------------------
// Difficulty badge config
// ---------------------------------------------------------------------------

const DIFFICULTY_META = {
  [DIFFICULTY.EASY]: { emoji: '🟢', label: 'Easy', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  [DIFFICULTY.MEDIUM]: { emoji: '🟡', label: 'Medium', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  [DIFFICULTY.HARD]: { emoji: '🔴', label: 'Hard', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  [DIFFICULTY.EXPERT]: { emoji: '💀', label: 'Expert', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
};

export default function App() {
  const { isLoading, error } = usePuzzleLoader();

  // Game state
  const puzzleId = useGameStore((s) => s.puzzleId);
  const puzzleNumber = useGameStore((s) => s.puzzleNumber);
  const puzzleDate = useGameStore((s) => s.puzzleDate);
  const difficulty = useGameStore((s) => s.difficulty);
  const player = useGameStore((s) => s.player);
  const stintCount = useGameStore((s) => s.stintCount);
  const availableTeams = useGameStore((s) => s.availableTeams);
  const gameStatus = useGameStore((s) => s.gameStatus);
  const guesses = useGameStore((s) => s.guesses);

  // Auth state
  const anonymousId = useAuthStore((s) => s.anonymousId);

  const diffMeta = DIFFICULTY_META[difficulty] ?? {};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="inline-flex items-center justify-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
          <span>🏀 NBA Career Timeline Puzzle</span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
          JourneyMan
        </h1>
      </header>

      {/* Main content */}
      <main className="w-full max-w-md space-y-4">
        {/* Loading state */}
        {isLoading && (
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
            <div className="animate-pulse text-slate-400">Loading today's puzzle…</div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-950/50 border border-red-500/20 rounded-2xl p-6 shadow-2xl">
            <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">Error</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Puzzle loaded — debug view */}
        {puzzleId && !isLoading && (
          <>
            {/* Player card */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Puzzle #{puzzleNumber} · {puzzleDate}
                  </p>
                  <h2 className="text-2xl font-bold text-slate-100 mt-1">
                    {player?.name ?? 'Unknown Player'}
                  </h2>
                </div>
                {difficulty && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${diffMeta.color}`}>
                    <span>{diffMeta.emoji}</span>
                    <span>{diffMeta.label}</span>
                  </span>
                )}
              </div>

              {/* Player image */}
              {player?.imageUrl && (
                <div className="flex justify-center mb-4">
                  <img
                    src={player.imageUrl}
                    alt={player.name}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-slate-700 shadow-lg"
                  />
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <p className="text-lg font-bold text-amber-400">{stintCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Stints</p>
                </div>
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <p className="text-lg font-bold text-amber-400">{MAX_ATTEMPTS}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Max Guesses</p>
                </div>
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <p className="text-lg font-bold text-amber-400">{guesses.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Attempted</p>
                </div>
              </div>
            </div>

            {/* Available teams */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                Available Teams ({availableTeams.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {availableTeams.map((team) => (
                  <span
                    key={team.id}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {team.abbreviation}
                  </span>
                ))}
              </div>
            </div>

            {/* Game status */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">
                Debug Info
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Game Status</span>
                  <span className="font-mono text-slate-200">{gameStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Anonymous ID</span>
                  <span className="font-mono text-slate-200 text-[10px] truncate max-w-[180px]">
                    {anonymousId ?? 'none'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Puzzle ID</span>
                  <span className="font-mono text-slate-200 text-[10px] truncate max-w-[180px]">
                    {puzzleId}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>


    </div>
  );
}
