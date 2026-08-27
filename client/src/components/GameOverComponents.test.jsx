import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import AnswerTimeline from './AnswerTimeline';
import NextPuzzleCountdown from './NextPuzzleCountdown';
import GameOverModal from './GameOverModal';
import SlotTile from './SlotTile';
import { FEEDBACK } from 'shared';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('AnswerTimeline Component', () => {
  afterEach(() => {
    cleanup();
  });

  const mockAnswer = [
    {
      stintOrder: 1,
      teamId: 'team-1',
      teamName: 'Cleveland Cavaliers',
      abbreviation: 'CLE',
      startYear: 2003,
      endYear: 2010,
    },
    {
      stintOrder: 2,
      teamId: 'team-2',
      teamName: 'Miami Heat',
      abbreviation: 'MIA',
      startYear: 2010,
      endYear: 2014,
    },
    {
      stintOrder: 3,
      teamId: 'team-1',
      teamName: 'Cleveland Cavaliers',
      abbreviation: 'CLE',
      startYear: 2014,
      endYear: 2018,
    },
  ];

  it('renders all stints with team names and years', () => {
    render(<AnswerTimeline answer={mockAnswer} />);

    expect(screen.getByText('Career Timeline')).toBeDefined();
    expect(screen.getAllByText('Cleveland Cavaliers').length).toBe(2);
    expect(screen.getByText('Miami Heat')).toBeDefined();
    expect(screen.getByText('2003 – 2010')).toBeDefined();
    expect(screen.getByText('2010 – 2014')).toBeDefined();
    expect(screen.getByText('2014 – 2018')).toBeDefined();
  });

  it('renders null when answer is empty or null', () => {
    const { container } = render(<AnswerTimeline answer={null} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('NextPuzzleCountdown Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders countdown clock and labels', () => {
    render(<NextPuzzleCountdown />);
    expect(screen.getByText('Next Puzzle In')).toBeDefined();
  });
});

describe('GameOverModal Component', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPlayer = {
    name: 'LeBron James',
    imageUrl: 'https://example.com/lebron.jpg',
  };

  const mockAnswer = [
    {
      stintOrder: 1,
      teamId: 'team-1',
      teamName: 'Cleveland Cavaliers',
      abbreviation: 'CLE',
      startYear: 2003,
      endYear: 2010,
    },
  ];

  it('renders victory state when won', () => {
    render(
      <GameOverModal
        open={true}
        onOpenChange={() => {}}
        gameStatus="won"
        player={mockPlayer}
        difficulty="hard"
        guessesCount={3}
        maxAttempts={6}
        answer={mockAnswer}
        puzzleNumber={42}
      />
    );

    expect(screen.getByText('You Solved It!')).toBeDefined();
    expect(screen.getByText('Solved in 3 guesses!')).toBeDefined();
    expect(screen.getByText('LeBron James')).toBeDefined();
    expect(screen.getAllByText('Cleveland Cavaliers').length).toBeGreaterThanOrEqual(1);
  });

  it('renders defeat state when lost', () => {
    render(
      <GameOverModal
        open={true}
        onOpenChange={() => {}}
        gameStatus="lost"
        player={mockPlayer}
        difficulty="hard"
        guessesCount={6}
        maxAttempts={6}
        answer={mockAnswer}
        puzzleNumber={42}
      />
    );

    expect(screen.getByText('Game Over')).toBeDefined();
    expect(screen.getByText('Better luck with tomorrow’s journey!')).toBeDefined();
  });
});

describe('SlotTile Component', () => {
  afterEach(() => {
    cleanup();
  });

  const mockAvailableTeams = [
    { id: 'team-lal', abbreviation: 'LAL', name: 'Los Angeles Lakers' },
    { id: 'team-mia', abbreviation: 'MIA', name: 'Miami Heat' },
  ];

  it('renders feedback tile with correct feedback styling', () => {
    render(
      <SlotTile
        index={0}
        teamId="team-lal"
        feedback={FEEDBACK.CORRECT}
        isLocked={false}
        availableTeams={mockAvailableTeams}
        isActive={false}
      />
    );

    expect(screen.getAllByText('LAL').length).toBeGreaterThanOrEqual(1);
  });

  it('renders feedback tile with incorrect feedback styling', () => {
    render(
      <SlotTile
        index={0}
        teamId="team-mia"
        feedback={FEEDBACK.INCORRECT}
        isLocked={false}
        availableTeams={mockAvailableTeams}
        isActive={false}
      />
    );

    expect(screen.getAllByText('MIA').length).toBeGreaterThanOrEqual(1);
  });

  it('renders locked slot in active row with lock icon', () => {
    render(
      <SlotTile
        index={0}
        teamId="team-lal"
        feedback={null}
        isLocked={true}
        availableTeams={mockAvailableTeams}
        isActive={true}
      />
    );

    expect(screen.getByTitle('Locked: Confirmed correct position')).toBeDefined();
    expect(screen.getAllByText('LAL').length).toBeGreaterThanOrEqual(1);
  });
});
