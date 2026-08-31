/**
 * server/tests/redis-caching.test.js
 * ===================================
 * Unit and integration tests for Redis caching, in-memory fallback,
 * proactive cache warming, and user profile cache lifecycle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCache, setCache, delCache, delPattern } from '../src/lib/redis.js';
import {
  fetchBaseDailyPuzzle,
  warmDailyPuzzleCache,
  getTodaysPuzzle,
} from '../src/services/puzzleService.js';
import { getUserProfile, linkAnonymousAccount } from '../src/services/authService.js';

// Mock Prisma
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
    $transaction: vi.fn(async (cb) => cb(prismaMock)),
    $disconnect: vi.fn(),
  };
  return { default: prismaMock };
});

import prisma from '../src/lib/prisma.js';

const MOCK_TEAMS = [
  { id: 'cle', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logoUrl: '/cle.png' },
  { id: 'mia', name: 'Miami Heat', abbreviation: 'MIA', logoUrl: '/mia.png' },
  { id: 'lal', name: 'Los Angeles Lakers', abbreviation: 'LAL', logoUrl: '/lal.png' },
];

const MOCK_PUZZLE = {
  id: 'puzzle-cache-test-1',
  date: new Date('2026-08-31'),
  puzzleNumber: 999,
  difficulty: 'hard',
  maxAttempts: 6,
  player: {
    id: 'player-test-lebron',
    firstName: 'LeBron',
    lastName: 'James',
    imageUrl: '/lebron.jpg',
    careerStints: [
      {
        stintOrder: 1,
        startYear: 2003,
        endYear: 2010,
        team: MOCK_TEAMS[0],
      },
      {
        stintOrder: 2,
        startYear: 2010,
        endYear: 2014,
        team: MOCK_TEAMS[1],
      },
      {
        stintOrder: 3,
        startYear: 2014,
        endYear: 2018,
        team: MOCK_TEAMS[0],
      },
      {
        stintOrder: 4,
        startYear: 2018,
        endYear: 2026,
        team: MOCK_TEAMS[2],
      },
    ],
  },
};

describe('Redis & In-Memory Cache Layer', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await delPattern('*');
  });

  it('stores, retrieves, and deletes values with TTL', async () => {
    const key = 'test:key:1';
    const data = { hello: 'world', timestamp: Date.now() };

    await setCache(key, data, 60);
    const retrieved = await getCache(key);
    expect(retrieved).toEqual(data);

    await delCache(key);
    const afterDel = await getCache(key);
    expect(afterDel).toBeNull();
  });

  it('supports pattern-based cache invalidation', async () => {
    await setCache('user:profile:1', { name: 'User 1' });
    await setCache('user:profile:2', { name: 'User 2' });
    await setCache('puzzle:daily:2026-08-31', { id: 'p1' });

    await delPattern('user:profile:*');

    expect(await getCache('user:profile:1')).toBeNull();
    expect(await getCache('user:profile:2')).toBeNull();
    expect(await getCache('puzzle:daily:2026-08-31')).toEqual({ id: 'p1' });
  });
});

describe('Daily Puzzle Caching & Proactive Warming', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await delPattern('*');
  });

  it('fetches from DB on cache miss and serves from cache on subsequent calls', async () => {
    prisma.dailyPuzzle.findUnique.mockResolvedValue(MOCK_PUZZLE);
    prisma.team.findMany.mockResolvedValue(MOCK_TEAMS);

    // Call 1: Cache Miss -> calls Prisma
    const firstCall = await fetchBaseDailyPuzzle('2026-08-31');
    expect(prisma.dailyPuzzle.findUnique).toHaveBeenCalledTimes(1);
    expect(firstCall.puzzleId).toBe('puzzle-cache-test-1');
    expect(firstCall.availableTeams).toHaveLength(3);

    // Call 2: Cache Hit -> does NOT call Prisma again!
    const secondCall = await fetchBaseDailyPuzzle('2026-08-31');
    expect(prisma.dailyPuzzle.findUnique).toHaveBeenCalledTimes(1); // Still 1!
    expect(secondCall).toEqual(firstCall);
  });

  it('warms cache proactively via warmDailyPuzzleCache', async () => {
    prisma.dailyPuzzle.findUnique.mockResolvedValue(MOCK_PUZZLE);
    prisma.team.findMany.mockResolvedValue(MOCK_TEAMS);

    const warmed = await warmDailyPuzzleCache('2026-08-31');
    expect(warmed.puzzleNumber).toBe(999);

    // Immediate lookup is served directly from cache with 0 DB calls
    prisma.dailyPuzzle.findUnique.mockClear();
    const retrieved = await fetchBaseDailyPuzzle('2026-08-31');
    expect(prisma.dailyPuzzle.findUnique).not.toHaveBeenCalled();
    expect(retrieved.puzzleNumber).toBe(999);
  });

  it('merges cached base puzzle with userResult when player has in-progress game', async () => {
    prisma.dailyPuzzle.findUnique.mockResolvedValue(MOCK_PUZZLE);
    prisma.team.findMany.mockResolvedValue(MOCK_TEAMS);

    // Mock an active user game result in DB
    prisma.dailyResult.findUnique.mockResolvedValue({
      id: 'res-1',
      userId: 'user-active-1',
      puzzleId: 'puzzle-cache-test-1',
      won: false,
      attempts: 2,
      guesses: [['cle', 'mia', 'cle', 'lal']],
      feedback: [['correct', 'correct', 'correct', 'correct']],
    });

    const payload = await getTodaysPuzzle(null, 'user-active-1');
    expect(payload.puzzleId).toBe('puzzle-cache-test-1');
    expect(payload.userResult).toBeDefined();
    expect(payload.userResult.attempts).toBe(2);
  });
});

describe('User Profile Caching', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await delPattern('*');
  });

  it('caches user profile and serves subsequent requests from cache', async () => {
    const mockUser = {
      id: 'user-profile-123',
      email: 'king@james.com',
      displayName: 'LeBron James',
      createdAt: new Date('2026-01-01'),
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    // First call: hits DB
    const p1 = await getUserProfile('user-profile-123');
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(p1.email).toBe('king@james.com');

    // Second call: served from Redis cache (0 DB calls)
    prisma.user.findUnique.mockClear();
    const p2 = await getUserProfile('user-profile-123');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(p2.email).toBe('king@james.com');
  });

  it('invalidates user profile cache upon account linking', async () => {
    const userId = 'registered-user-456';
    const anonId = 'anon-session-789';

    // Seed profile in cache
    await setCache(`user:profile:${userId}`, { id: userId, email: 'test@example.com' });
    expect(await getCache(`user:profile:${userId}`)).toBeDefined();

    prisma.user.findUnique.mockResolvedValue({
      id: 'anon-shadow-id',
      anonymousId: anonId,
      dailyResults: [],
    });
    prisma.dailyResult.findMany.mockResolvedValue([]);

    await linkAnonymousAccount(userId, anonId);

    // Cache should have been invalidated
    const afterLink = await getCache(`user:profile:${userId}`);
    expect(afterLink).toBeNull();
  });
});
