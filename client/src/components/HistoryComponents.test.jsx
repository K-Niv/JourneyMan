/**
 * client/src/components/HistoryComponents.test.jsx
 * =================================================
 * Unit & Integration tests for History and Stats components:
 *  - StatsPanel (KPI tiles & guess distribution)
 *  - CalendarGrid (month navigation, day cells, details card)
 *  - HistoryModal (tab switching, data loading, error states)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import StatsPanel from './StatsPanel';
import CalendarGrid from './CalendarGrid';
import Header from './Header';
import { useAuthStore } from '../stores/authStore';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  fetchStats: vi.fn(),
  fetchHistory: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  linkAnonymousAccount: vi.fn(),
  fetchUserProfile: vi.fn(),
}));

describe('History Components', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // StatsPanel
  // =========================================================================
  describe('StatsPanel', () => {
    const mockStats = {
      gamesPlayed: 10,
      gamesWon: 8,
      winRate: 80,
      currentStreak: 4,
      maxStreak: 6,
      averageAttempts: 3.5,
      attemptDistribution: {
        1: 1,
        2: 2,
        3: 3,
        4: 1,
        5: 1,
        6: 0,
        fail: 2,
      },
    };

    it('renders all KPI tiles correctly', () => {
      render(<StatsPanel stats={mockStats} />);

      expect(screen.getByText('10')).toBeDefined();
      expect(screen.getByText('Played')).toBeDefined();

      expect(screen.getByText('80%')).toBeDefined();
      expect(screen.getByText('Win Rate')).toBeDefined();

      expect(screen.getByText('Current Streak')).toBeDefined();
      expect(screen.getAllByText('4').length).toBeGreaterThan(0);
      expect(screen.getByText('Max Streak')).toBeDefined();
      expect(screen.getAllByText('6').length).toBeGreaterThan(0);
    });

    it('renders average attempts and guess distribution bars', () => {
      render(<StatsPanel stats={mockStats} />);

      expect(screen.getByText(/3.5 \/ 6/i)).toBeDefined();
      expect(screen.getByText(/Guess Distribution/i)).toBeDefined();
      // Failed attempts indicator
      expect(screen.getByText('X')).toBeDefined();
    });

    it('returns null if stats object is missing', () => {
      const { container } = render(<StatsPanel stats={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  // =========================================================================
  // CalendarGrid
  // =========================================================================
  describe('CalendarGrid', () => {
    const mockResults = [
      {
        id: 'r1',
        date: '2026-08-10',
        puzzleNumber: 10,
        difficulty: 'hard',
        playerName: 'LeBron James',
        won: true,
        attempts: 3,
        maxAttempts: 6,
      },
      {
        id: 'r2',
        date: '2026-08-12',
        puzzleNumber: 12,
        difficulty: 'easy',
        playerName: 'Stephen Curry',
        won: false,
        attempts: 6,
        maxAttempts: 6,
      },
    ];

    it('renders month name and weekday headers', () => {
      render(<CalendarGrid results={mockResults} year={2026} month={8} />);

      expect(screen.getByText(/August 2026/i)).toBeDefined();
      expect(screen.getByText('Su')).toBeDefined();
      expect(screen.getByText('Fr')).toBeDefined();
    });

    it('disables previous month button when at earliest month (August 2026)', () => {
      render(<CalendarGrid results={mockResults} year={2026} month={8} />);

      const prevBtn = screen.getByLabelText(/previous month/i);
      expect(prevBtn.disabled).toBe(true);
    });

    it('enables previous month button when in future month (e.g. Sept 2026)', () => {
      render(<CalendarGrid results={mockResults} year={2026} month={9} />);

      const prevBtn = screen.getByLabelText(/previous month/i);
      expect(prevBtn.disabled).toBe(false);
    });

    it('calls onMonthChange when next month is clicked', () => {
      const onMonthChange = vi.fn();
      render(
        <CalendarGrid
          results={mockResults}
          year={2026}
          month={8}
          onMonthChange={onMonthChange}
        />
      );

      const nextBtn = screen.getByLabelText(/next month/i);
      fireEvent.click(nextBtn);

      expect(onMonthChange).toHaveBeenCalledWith(2026, 9);
    });

    it('shows selected result details card when a played day is clicked', () => {
      render(<CalendarGrid results={mockResults} year={2026} month={8} />);

      // Click on day 10 (won puzzle)
      const day10Btn = screen.getByText('3/6').closest('button');
      fireEvent.click(day10Btn);

      expect(screen.getByText('LeBron James')).toBeDefined();
      expect(screen.getByText(/Puzzle #10/i)).toBeDefined();
      expect(screen.getByText(/3\/6 Guesses/i)).toBeDefined();
    });
  });

  // =========================================================================
  // HistoryModal & Header integration
  // =========================================================================
  describe('HistoryModal & Header Integration', () => {
    it('prompts guest user to sign in when clicking calendar button in Header', () => {
      render(<Header puzzleNumber={1} puzzleDate="2026-08-28" />);

      const calendarBtn = screen.getByLabelText(/history & stats/i);
      fireEvent.click(calendarBtn);

      // Auth modal should open
      expect(screen.getByText(/welcome back/i)).toBeDefined();
    });

    it('opens HistoryModal and fetches data when authenticated user clicks calendar', async () => {
      useAuthStore.setState({
        user: { id: 'u1', email: 'test@example.com', displayName: 'Player One' },
      });

      api.fetchStats.mockResolvedValue({
        stats: {
          gamesPlayed: 5,
          gamesWon: 4,
          winRate: 80,
          currentStreak: 2,
          maxStreak: 3,
          averageAttempts: 3.0,
          attemptDistribution: { 1: 0, 2: 1, 3: 2, 4: 1, 5: 0, 6: 0, fail: 1 },
        },
      });

      api.fetchHistory.mockResolvedValue({
        history: [],
      });

      render(<Header puzzleNumber={1} puzzleDate="2026-08-28" />);

      const calendarBtn = screen.getByLabelText(/history & stats/i);
      fireEvent.click(calendarBtn);

      // Modal title
      await waitFor(() => {
        expect(screen.getByText('Your Journey')).toBeDefined();
      });

      expect(api.fetchStats).toHaveBeenCalled();
      expect(api.fetchHistory).toHaveBeenCalled();

      // Switch to Calendar tab
      const calendarTabBtn = screen.getByRole('button', { name: /calendar/i });
      fireEvent.click(calendarTabBtn);

      expect(screen.getByText(/(August|September) 2026/i)).toBeDefined();
    });
  });
});
