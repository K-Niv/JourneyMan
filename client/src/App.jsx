import React, { useState, useEffect } from 'react';
import { MAX_ATTEMPTS } from 'shared';

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:3000')
      ? '/api/health'
      : '/api/health';

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      <header className="text-center mb-8">
        <div className="inline-flex items-center justify-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
          <span>🏀 NBA Career Timeline Puzzle</span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
          JourneyMan
        </h1>
        <p className="mt-2 text-slate-400 text-sm max-w-md">
          Reconstruct the team-by-team career timeline of NBA players in order.
        </p>
      </header>

      <main className="w-full max-w-md bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Status</span>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
            Max Attempts: {MAX_ATTEMPTS}
          </span>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Backend Health Check</p>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                {loading ? (
                  <span className="text-slate-500 animate-pulse">Connecting to server...</span>
                ) : health ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Online ({health.status})
                  </span>
                ) : (
                  <span className="text-rose-400">Offline / Connection Error</span>
                )}
              </p>
            </div>
            {health && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                /api/health
              </span>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-8 text-center text-xs text-slate-500">
        JourneyMan Portfolio Project &bull; Built with React + Express + Tailwind
      </footer>
    </div>
  );
}
