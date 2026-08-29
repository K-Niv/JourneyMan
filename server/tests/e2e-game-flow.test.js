/**
 * server/tests/e2e-game-flow.test.js
 * ===================================
 * Full lifecycle end-to-end integration tests simulating complete user journeys:
 *  - Guest puzzle retrieval & validation checks
 *  - Guess submission & duplicate-aware grading
 *  - Game victory & timeline reveal
 *  - Registration, JWT authentication, and anonymous account migration
 *  - Stats aggregation, streak calculation & history verification
 *  - Complete 6-attempt game-over loss flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------
vi.mock('../src/lib/prisma.js', () => {
  const prismaMock = {
    dailyPuzzle: {
      findUnique: vi.fn(),
    },
    team: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    dailyResult: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prismaMock);
    }),
    $disconnect: vi.fn(),
  };
  return { default: prismaMock };
});

import prisma from '../src/lib/prisma.js';

// ---------------------------------------------------------------------------
// Shared Fixtures
// ---------------------------------------------------------------------------
const MOCK_TEAMS = [
  { id: 'cle', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logoUrl: '/cle.png' },
  { id: 'mia', name: 'Miami Heat', abbreviation: 'MIA', logoUrl: '/mia.png' },
  { id: 'lal', name: 'Los Angeles Lakers', abbreviation: 'LAL', logoUrl: '/lal.png' },
  { id: 'bos', name: 'Boston Celtics', abbreviation: 'BOS', logoUrl: '/bos.png' },
];

const MOCK_PUZZLE = {
  id: 'puzzle-e2e-001',
  date: new Date('2026-08-29T00:00:00.000Z'),
  puzzleNumber: 101,
  difficulty: 'medium',
  maxAttempts: 6,
  player: {
    id: 'player-lebron',
    firstName: 'LeBron',
    lastName: 'James',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/lebron.jpg',
    careerStints: [
      {
        stintOrder: 1,
        teamId: 'cle',
        startYear: 2003,
        endYear: 2010,
        gamesPlayed: 548,
        team: { id: 'cle', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logoUrl: '/cle.png' },
      },
      {
        stintOrder: 2,
        teamId: 'mia',
        startYear: 2010,
        endYear: 2014,
        gamesPlayed: 294,
        team: { id: 'mia', name: 'Miami Heat', abbreviation: 'MIA', logoUrl: '/mia.png' },
      },
      {
        stintOrder: 3,
        teamId: 'lal',
        startYear: 2018,
        endYear: 2026,
        gamesPlayed: 352,
        team: { id: 'lal', name: 'Los Angeles Lakers', abbreviation: 'LAL', logoUrl: '/lal.png' },
      },
    ],
  },
};

describe('End-to-End Game Lifecycle Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes the full happy path: guest plays, wins, registers, links history, and views stats', async () => {
    // -----------------------------------------------------------------------
    // Step 1: Guest fetches today's puzzle
    // -----------------------------------------------------------------------
    prisma.dailyPuzzle.findUnique.mockResolvedValue(MOCK_PUZZLE);
    prisma.team.findMany.mockResolvedValue(MOCK_TEAMS);

    const puzzleRes = await request(app).get('/api/puzzle/today');
    expect(puzzleRes.status).toBe(200);
    expect(puzzleRes.body.puzzleId).toBe('puzzle-e2e-001');
    expect(puzzleRes.body.player.name).toBe('LeBron James');
    expect(puzzleRes.body.stintCount).toBe(3);
    expect(puzzleRes.body.difficulty).toBe('medium');
    expect(puzzleRes.body.availableTeams).toHaveLength(4);
    // CRITICAL: Answer must NOT be present
    expect(puzzleRes.body.answer).toBeUndefined();

    // -----------------------------------------------------------------------
    // Step 2: Guest submits invalid guesses (validation checks)
    // -----------------------------------------------------------------------
    const invalidLengthRes = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: ['cle', 'mia'] }); // Only 2 items instead of 3
    expect(invalidLengthRes.status).toBe(400);

    const invalidTypeRes = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: 'not-an-array' });
    expect(invalidTypeRes.status).toBe(400);

    // -----------------------------------------------------------------------
    // Step 3: Guest submits 1st attempt (incorrect guess)
    // -----------------------------------------------------------------------
    const anonId = 'anon-e2e-user-123';
    prisma.user.upsert.mockResolvedValue({ id: 'shadow-user-123', anonymousId: anonId });
    prisma.dailyResult.findUnique.mockResolvedValue(null); // No existing result
    prisma.dailyResult.create.mockResolvedValue({
      id: 'result-123',
      userId: 'shadow-user-123',
      puzzleId: 'puzzle-e2e-001',
      won: false,
      attempts: 1,
      guesses: [['bos', 'cle', 'lal']],
      feedback: [['incorrect', 'misplaced', 'correct']],
    });

    const guess1Res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', anonId)
      .send({ guess: ['bos', 'cle', 'lal'] });

    expect(guess1Res.status).toBe(200);
    expect(guess1Res.body.feedback).toEqual(['incorrect', 'misplaced', 'correct']);
    expect(guess1Res.body.gameOver).toBe(false);
    expect(guess1Res.body.won).toBe(false);
    expect(guess1Res.body.attemptNumber).toBe(1);
    expect(guess1Res.body.maxAttempts).toBe(6);
    expect(guess1Res.body.answer).toBeUndefined();

    // -----------------------------------------------------------------------
    // Step 4: Guest submits 2nd attempt (winning guess)
    // -----------------------------------------------------------------------
    prisma.dailyResult.findUnique.mockResolvedValue({
      id: 'result-123',
      userId: 'shadow-user-123',
      puzzleId: 'puzzle-e2e-001',
      won: false,
      attempts: 1,
      guesses: [['bos', 'cle', 'lal']],
      feedback: [['incorrect', 'misplaced', 'correct']],
    });
    prisma.dailyResult.update.mockResolvedValue({
      id: 'result-123',
      userId: 'shadow-user-123',
      puzzleId: 'puzzle-e2e-001',
      won: true,
      attempts: 2,
      guesses: [
        ['bos', 'cle', 'lal'],
        ['cle', 'mia', 'lal'],
      ],
      feedback: [
        ['incorrect', 'misplaced', 'correct'],
        ['correct', 'correct', 'correct'],
      ],
    });

    const guess2Res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', anonId)
      .send({ guess: ['cle', 'mia', 'lal'] });

    expect(guess2Res.status).toBe(200);
    expect(guess2Res.body.feedback).toEqual(['correct', 'correct', 'correct']);
    expect(guess2Res.body.gameOver).toBe(true);
    expect(guess2Res.body.won).toBe(true);
    expect(guess2Res.body.attemptNumber).toBe(2);
    // Answer timeline revealed upon game over
    expect(guess2Res.body.answer).toHaveLength(3);
    expect(guess2Res.body.answer[0]).toEqual({
      stintOrder: 1,
      teamId: 'cle',
      teamName: 'Cleveland Cavaliers',
      abbreviation: 'CLE',
      startYear: 2003,
      endYear: 2010,
    });

    // -----------------------------------------------------------------------
    // Step 5: Subsequent guess rejected after game over (409 Conflict)
    // -----------------------------------------------------------------------
    prisma.dailyResult.findUnique.mockResolvedValue({
      id: 'result-123',
      userId: 'shadow-user-123',
      puzzleId: 'puzzle-e2e-001',
      won: true,
      attempts: 2,
    });

    const guessAfterOverRes = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', anonId)
      .send({ guess: ['cle', 'mia', 'lal'] });

    expect(guessAfterOverRes.status).toBe(409);
    expect(guessAfterOverRes.body.error).toBe('This puzzle is already completed for today.');

    // -----------------------------------------------------------------------
    // Step 6: User registers an account
    // -----------------------------------------------------------------------
    const passwordHash = await bcrypt.hash('secretPass123', 10);
    prisma.user.findUnique.mockResolvedValueOnce(null); // Check if email taken
    prisma.user.create.mockResolvedValue({
      id: 'auth-user-999',
      email: 'lebronfan@example.com',
      displayName: 'KingJamesFan',
      passwordHash,
      createdAt: new Date(),
    });

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'lebronfan@example.com',
        password: 'secretPass123',
        displayName: 'KingJamesFan',
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user.email).toBe('lebronfan@example.com');
    expect(registerRes.body.token).toBeDefined();
    const token = registerRes.body.token;

    // -----------------------------------------------------------------------
    // Step 7: User links anonymous history
    // -----------------------------------------------------------------------
    prisma.user.findUnique.mockResolvedValue({
      id: 'shadow-user-123',
      anonymousId: anonId,
      dailyResults: [
        {
          id: 'result-123',
          puzzleId: 'puzzle-e2e-001',
          userId: 'shadow-user-123',
        },
      ],
    }); // find shadow user with dailyResults

    prisma.dailyResult.findMany.mockResolvedValue([]); // target user has no existing results

    prisma.dailyResult.update.mockResolvedValue({});
    prisma.user.delete.mockResolvedValue({});

    const linkRes = await request(app)
      .post('/api/auth/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ anonymousId: anonId });

    expect(linkRes.status).toBe(200);
    expect(linkRes.body.migratedCount).toBe(1);

    // -----------------------------------------------------------------------
    // Step 8: User fetches stats and history
    // -----------------------------------------------------------------------
    prisma.dailyResult.findMany.mockResolvedValue([
      {
        id: 'result-123',
        userId: 'auth-user-999',
        puzzleId: 'puzzle-e2e-001',
        won: true,
        attempts: 2,
        completedAt: new Date('2026-08-29T12:00:00Z'),
        puzzle: {
          id: 'puzzle-e2e-001',
          date: new Date('2026-08-29T00:00:00Z'),
          puzzleNumber: 101,
          difficulty: 'medium',
          player: {
            firstName: 'LeBron',
            lastName: 'James',
            imageUrl: 'https://upload.wikimedia.org/lebron.jpg',
          },
        },
      },
    ]);

    const statsRes = await request(app)
      .get('/api/history/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.stats.gamesPlayed).toBe(1);
    expect(statsRes.body.stats.gamesWon).toBe(1);
    expect(statsRes.body.stats.winRate).toBe(100);
    expect(statsRes.body.stats.currentStreak).toBe(1);
    expect(statsRes.body.stats.maxStreak).toBe(1);
    expect(statsRes.body.stats.attemptDistribution['2']).toBe(1);
  });

  it('handles game over loss scenario after 6 failed attempts', async () => {
    prisma.dailyPuzzle.findUnique.mockResolvedValue(MOCK_PUZZLE);
    const anonId = 'anon-loss-user';
    prisma.user.upsert.mockResolvedValue({ id: 'shadow-loss', anonymousId: anonId });

    // 5 attempts already recorded
    prisma.dailyResult.findUnique.mockResolvedValue({
      id: 'result-loss',
      userId: 'shadow-loss',
      puzzleId: 'puzzle-e2e-001',
      won: false,
      attempts: 5,
      guesses: Array(5).fill(['bos', 'bos', 'bos']),
      feedback: Array(5).fill(['incorrect', 'incorrect', 'incorrect']),
    });

    prisma.dailyResult.update.mockResolvedValue({
      id: 'result-loss',
      userId: 'shadow-loss',
      puzzleId: 'puzzle-e2e-001',
      won: false,
      attempts: 6,
      guesses: Array(6).fill(['bos', 'bos', 'bos']),
      feedback: Array(6).fill(['incorrect', 'incorrect', 'incorrect']),
    });

    const sixthGuessRes = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', anonId)
      .send({ guess: ['bos', 'bos', 'bos'] });

    expect(sixthGuessRes.status).toBe(200);
    expect(sixthGuessRes.body.gameOver).toBe(true);
    expect(sixthGuessRes.body.won).toBe(false);
    expect(sixthGuessRes.body.attemptNumber).toBe(6);
    // Correct answer is revealed so player learns what it was
    expect(sixthGuessRes.body.answer).toHaveLength(3);
    expect(sixthGuessRes.body.answer[0].teamName).toBe('Cleveland Cavaliers');
  });
});
