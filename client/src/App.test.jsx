import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import App from './App.jsx';
import { useGameStore } from './stores/gameStore';
import { useAuthStore } from './stores/authStore';
import * as api from './services/api';

vi.mock('./services/api', () => ({
  fetchTodaysPuzzle: vi.fn(),
  fetchUserProfile: vi.fn(),
  submitGuessToApi: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  linkAnonymousAccount: vi.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    useAuthStore.getState().clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders JourneyMan header title', () => {
    render(<App />);
    const heading = screen.getByText('JourneyMan');
    expect(heading).toBeDefined();
  });

  it('displays LandingLoader on landing page while requests are in flight', () => {
    api.fetchTodaysPuzzle.mockReturnValue(new Promise(() => {}));
    api.fetchUserProfile.mockReturnValue(new Promise(() => {}));

    render(<App />);

    // LandingLoader should be present
    expect(screen.getByTestId('landing-loader')).toBeDefined();
    expect(screen.getByText(/loading daily puzzle/i)).toBeDefined();

    // CTA buttons on landing page should be disabled
    const playBtn = screen.getByRole('button', { name: /play today's puzzle/i });
    expect(playBtn.hasAttribute('disabled')).toBe(true);
  });

  it('dismisses LandingLoader and enables CTAs once both requests finish', async () => {
    let resolvePuzzle;
    let resolveAuth;

    api.fetchTodaysPuzzle.mockReturnValue(
      new Promise((resolve) => {
        resolvePuzzle = resolve;
      })
    );

    api.fetchUserProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveAuth = resolve;
      })
    );

    render(<App />);

    // Loader is active
    expect(screen.getByTestId('landing-loader')).toBeDefined();

    // Settle both requests
    await act(async () => {
      resolveAuth({ user: null });
      resolvePuzzle({
        puzzleId: 'p-today',
        puzzleNumber: 42,
        date: new Date().toISOString().slice(0, 10),
        difficulty: 'easy',
        maxAttempts: 6,
        player: { id: 'pl-1', name: 'Curry', imageUrl: null },
        stintCount: 1,
        availableTeams: Array.from({ length: 30 }, (_, i) => ({ id: `t-${i}`, name: `Team ${i}` })),
      });
    });

    // Loader should now be gone
    expect(screen.queryByTestId('landing-loader')).toBeNull();

    // Play CTA should be interactive
    const playBtn = screen.getByRole('button', { name: /play today's puzzle/i });
    expect(playBtn.hasAttribute('disabled')).toBe(false);
  });
});

