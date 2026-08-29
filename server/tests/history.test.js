/**
 * server/tests/history.test.js
 * =============================
 * Integration tests for user history, calendar queries, and stats endpoints.
 *
 * Strategy: Prisma Client is mocked via vi.mock so no real PostgreSQL instance is required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------
vi.mock('../src/lib/prisma.js', () => {
  const prismaMock = {
    dailyResult: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  return { default: prismaMock };
});

import prisma from '../src/lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

function makeAuthHeader(userId = 'user-test-123', email = 'test@example.com') {
  const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

describe('History & Stats Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // GET /api/history
  // =========================================================================
  describe('GET /api/history', () => {
    it('401: rejects request when no authorization header is provided', async () => {
      const res = await request(app).get('/api/history');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Authentication required/i);
    });

    it('401: rejects request when invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/history')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid or expired token/i);
    });

    it('400: returns 400 for invalid month parameter', async () => {
      const res = await request(app)
        .get('/api/history?year=2026&month=15')
        .set('Authorization', makeAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid month/i);
    });

    it('400: returns 400 for invalid year parameter', async () => {
      const res = await request(app)
        .get('/api/history?year=1800&month=8')
        .set('Authorization', makeAuthHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid year/i);
    });

    it('200: returns monthly history for authenticated user', async () => {
      prisma.dailyResult.findMany.mockResolvedValue([
        {
          id: 'res-1',
          userId: 'user-test-123',
          puzzleId: 'puzzle-1',
          won: true,
          attempts: 3,
          completedAt: new Date('2026-08-10T15:30:00Z'),
          puzzle: {
            date: new Date('2026-08-10T00:00:00Z'),
            puzzleNumber: 10,
            difficulty: 'medium',
            maxAttempts: 6,
            player: {
              firstName: 'Stephen',
              lastName: 'Curry',
            },
          },
        },
        {
          id: 'res-2',
          userId: 'user-test-123',
          puzzleId: 'puzzle-2',
          won: false,
          attempts: 6,
          completedAt: new Date('2026-08-11T16:00:00Z'),
          puzzle: {
            date: new Date('2026-08-11T00:00:00Z'),
            puzzleNumber: 11,
            difficulty: 'hard',
            maxAttempts: 6,
            player: {
              firstName: 'LeBron',
              lastName: 'James',
            },
          },
        },
      ]);

      const res = await request(app)
        .get('/api/history?year=2026&month=8')
        .set('Authorization', makeAuthHeader('user-test-123'));

      expect(res.status).toBe(200);
      expect(res.body.history).toHaveLength(2);
      expect(res.body.history[0]).toEqual({
        id: 'res-1',
        puzzleId: 'puzzle-1',
        date: '2026-08-10',
        puzzleNumber: 10,
        difficulty: 'medium',
        playerName: 'Stephen Curry',
        won: true,
        attempts: 3,
        maxAttempts: 6,
        completedAt: expect.any(String),
      });
      expect(res.body.history[1].won).toBe(false);
      expect(res.body.history[1].playerName).toBe('LeBron James');
    });

    it('200: returns empty array when user has no results for the given month', async () => {
      prisma.dailyResult.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/history')
        .set('Authorization', makeAuthHeader());

      expect(res.status).toBe(200);
      expect(res.body.history).toEqual([]);
    });
  });

  // =========================================================================
  // GET /api/history/stats
  // =========================================================================
  describe('GET /api/history/stats', () => {
    it('401: rejects request when no token is provided', async () => {
      const res = await request(app).get('/api/history/stats');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Authentication required/i);
    });

    it('200: returns zeroed stats when user has played zero games', async () => {
      prisma.dailyResult.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/history/stats')
        .set('Authorization', makeAuthHeader('user-test-123'));

      expect(res.status).toBe(200);
      expect(res.body.stats).toEqual({
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        currentStreak: 0,
        maxStreak: 0,
        averageAttempts: 0,
        attemptDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          fail: 0,
        },
      });
    });

    it('200: computes aggregate stats, attempt distribution, and streaks correctly', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      prisma.dailyResult.findMany.mockResolvedValue([
        // Game 1: 2 days ago, won in 2 attempts
        {
          id: 'r1',
          won: true,
          attempts: 2,
          puzzle: {
            date: new Date(`${twoDaysAgo}T00:00:00Z`),
            puzzleNumber: 1,
            difficulty: 'easy',
            maxAttempts: 6,
          },
        },
        // Game 2: yesterday, won in 4 attempts
        {
          id: 'r2',
          won: true,
          attempts: 4,
          puzzle: {
            date: new Date(`${yesterday}T00:00:00Z`),
            puzzleNumber: 2,
            difficulty: 'medium',
            maxAttempts: 6,
          },
        },
        // Game 3: today, won in 4 attempts
        {
          id: 'r3',
          won: true,
          attempts: 4,
          puzzle: {
            date: new Date(`${todayStr}T00:00:00Z`),
            puzzleNumber: 3,
            difficulty: 'hard',
            maxAttempts: 6,
          },
        },
      ]);

      const res = await request(app)
        .get('/api/history/stats')
        .set('Authorization', makeAuthHeader('user-test-123'));

      expect(res.status).toBe(200);
      const stats = res.body.stats;
      expect(stats.gamesPlayed).toBe(3);
      expect(stats.gamesWon).toBe(3);
      expect(stats.winRate).toBe(100);
      expect(stats.currentStreak).toBe(3);
      expect(stats.maxStreak).toBe(3);
      expect(stats.averageAttempts).toBe(3.3); // (2 + 4 + 4) / 3 = 3.333 -> 3.3
      expect(stats.attemptDistribution).toEqual({
        1: 0,
        2: 1,
        3: 0,
        4: 2,
        5: 0,
        6: 0,
        fail: 0,
      });
    });

    it('200: handles losses and broken streaks correctly', async () => {
      // Historical data with broken streak and a lost game
      prisma.dailyResult.findMany.mockResolvedValue([
        // 4 consecutive wins
        { won: true, attempts: 1, puzzle: { date: new Date('2026-08-01T00:00:00Z') } },
        { won: true, attempts: 2, puzzle: { date: new Date('2026-08-02T00:00:00Z') } },
        { won: true, attempts: 3, puzzle: { date: new Date('2026-08-03T00:00:00Z') } },
        { won: true, attempts: 4, puzzle: { date: new Date('2026-08-04T00:00:00Z') } },
        // Lost game on day 5
        { won: false, attempts: 6, puzzle: { date: new Date('2026-08-05T00:00:00Z') } },
        // 2 consecutive wins on day 6 and 7
        { won: true, attempts: 5, puzzle: { date: new Date('2026-08-06T00:00:00Z') } },
        { won: true, attempts: 6, puzzle: { date: new Date('2026-08-07T00:00:00Z') } },
      ]);

      const res = await request(app)
        .get('/api/history/stats')
        .set('Authorization', makeAuthHeader('user-test-123'));

      expect(res.status).toBe(200);
      const stats = res.body.stats;
      expect(stats.gamesPlayed).toBe(7);
      expect(stats.gamesWon).toBe(6);
      expect(stats.winRate).toBe(86); // 6/7 = 85.7% -> 86%
      expect(stats.maxStreak).toBe(4);
      // Since 2026-08-07 was long in past relative to current date (unless today is Aug 7/8), current streak should be 0
      expect(stats.currentStreak).toBe(0);
      expect(stats.attemptDistribution).toEqual({
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 1,
        fail: 1,
      });
    });
  });
});
