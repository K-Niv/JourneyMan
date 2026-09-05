/**
 * client/src/components/LandingLoader.test.jsx
 * =============================================
 * Tests for LandingLoader, LandingPage loading states,
 * and multi-request coordination in usePuzzleLoader.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, renderHook, act } from '@testing-library/react';
import LandingLoader from './LandingLoader';
import LandingPage from './LandingPage';
import { usePuzzleLoader } from '../hooks/usePuzzleLoader';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  fetchTodaysPuzzle: vi.fn(),
  fetchUserProfile: vi.fn(),
  submitGuessToApi: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  linkAnonymousAccount: vi.fn(),
}));

describe('LandingLoader Component', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders with accessibility attributes and unified branding', () => {
    render(<LandingLoader />);

    const loader = screen.getByTestId('landing-loader');
    expect(loader).toBeDefined();
    expect(loader.getAttribute('role')).toBe('status');
    expect(loader.getAttribute('aria-live')).toBe('polite');

    // Title and unified message
    expect(screen.getByText(/loading daily puzzle/i)).toBeDefined();
    expect(
      screen.getByText(/Preparing today's NBA career timeline challenge/i)
    ).toBeDefined();

    // Brand logo
    expect(screen.getByText('JM')).toBeDefined();
  });

  it('captures and stops propagation of click events', () => {
    const handleOuterClick = vi.fn();
    render(
      <div onClick={handleOuterClick} data-testid="outer-container">
        <LandingLoader />
      </div>
    );

    const loader = screen.getByTestId('landing-loader');
    fireEvent.click(loader);

    expect(handleOuterClick).not.toHaveBeenCalled();
  });

  it('prevents default on navigation key presses like Tab and Enter', () => {
    render(<LandingLoader />);

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    window.dispatchEvent(tabEvent);
    expect(tabEvent.defaultPrevented).toBe(true);

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    window.dispatchEvent(enterEvent);
    expect(enterEvent.defaultPrevented).toBe(true);
  });
});

describe('LandingPage Loading State', () => {
  afterEach(() => {
    cleanup();
  });

  it('disables CTA buttons when isLoading is true', () => {
    const handlePlay = vi.fn();
    const handleHelp = vi.fn();

    render(
      <LandingPage
        onPlay={handlePlay}
        onOpenHelp={handleHelp}
        isLoading={true}
      />
    );

    const playBtn = screen.getByRole('button', { name: /play today's puzzle/i });
    const rulesBtn = screen.getByRole('button', { name: /how to play/i });

    expect(playBtn.hasAttribute('disabled')).toBe(true);
    expect(rulesBtn.hasAttribute('disabled')).toBe(true);

    fireEvent.click(playBtn);
    expect(handlePlay).not.toHaveBeenCalled();
  });

  it('enables CTA buttons when isLoading is false', () => {
    const handlePlay = vi.fn();

    render(
      <LandingPage
        onPlay={handlePlay}
        onOpenHelp={vi.fn()}
        isLoading={false}
      />
    );

    const playBtn = screen.getByRole('button', { name: /play today's puzzle/i });
    expect(playBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(playBtn);
    expect(handlePlay).toHaveBeenCalledTimes(1);
  });
});

describe('usePuzzleLoader Multi-Request Coordination', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    useAuthStore.getState().clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('remains loading until BOTH puzzle details and auth details complete', async () => {
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

    const { result } = renderHook(() => usePuzzleLoader());

    // Initially, both requests are in progress
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPuzzleLoading).toBe(true);
    expect(result.current.isAuthLoading).toBe(true);

    // Scenario A: Auth resolves first
    await act(async () => {
      resolveAuth({ user: { id: 'u1', email: 'test@example.com' } });
    });

    // isLoading must STAY true because puzzle is still loading!
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPuzzleLoading).toBe(true);
    expect(result.current.isAuthLoading).toBe(false);

    // Now puzzle resolves
    await act(async () => {
      resolvePuzzle({
        puzzleId: 'p-100',
        puzzleNumber: 100,
        date: new Date().toISOString().slice(0, 10),
        difficulty: 'medium',
        maxAttempts: 6,
        player: { id: 'pl-1', name: 'Stephen Curry', imageUrl: null },
        stintCount: 1,
        availableTeams: Array.from({ length: 30 }, (_, i) => ({ id: `t-${i}`, name: `Team ${i}` })),
      });
    });

    // NOW both are complete, so isLoading becomes false!
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPuzzleLoading).toBe(false);
    expect(result.current.isAuthLoading).toBe(false);
  });

  it('stays loading if puzzle completes first but auth is still pending', async () => {
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

    const { result } = renderHook(() => usePuzzleLoader());

    expect(result.current.isLoading).toBe(true);

    // Puzzle resolves first
    await act(async () => {
      resolvePuzzle({
        puzzleId: 'p-200',
        puzzleNumber: 200,
        date: new Date().toISOString().slice(0, 10),
        difficulty: 'hard',
        maxAttempts: 6,
        player: { id: 'pl-2', name: 'LeBron James', imageUrl: null },
        stintCount: 4,
        availableTeams: Array.from({ length: 30 }, (_, i) => ({ id: `t-${i}`, name: `Team ${i}` })),
      });
    });

    // isLoading must STAY true because auth is still loading!
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPuzzleLoading).toBe(false);
    expect(result.current.isAuthLoading).toBe(true);

    // Auth rejects (e.g. 401 unauthenticated guest)
    await act(async () => {
      const err = new Error('Unauthorized');
      err.status = 401;
      resolveAuth(Promise.reject(err));
    });

    // Both finished, so loading resolves
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPuzzleLoading).toBe(false);
    expect(result.current.isAuthLoading).toBe(false);
  });
});
