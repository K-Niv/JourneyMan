/**
 * server/tests/auth.test.js
 * ==========================
 * Integration tests for authentication and account linking endpoints.
 *
 * Strategy: Prisma Client is mocked via vi.mock so no real PostgreSQL
 * instance is required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { delPattern } from '../src/lib/redis.js';

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------
vi.mock('../src/lib/prisma.js', () => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    dailyResult: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      return cb(prismaMock);
    }),
  };
  return { default: prismaMock };
});

import prisma from '../src/lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await delPattern('*');
  });

  // =========================================================================
  // POST /api/auth/register
  // =========================================================================
  describe('POST /api/auth/register', () => {
    it('201: registers user and returns profile and JWT', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'HoopsFan',
        createdAt: new Date('2026-08-28T00:00:00Z'),
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'Test@example.com ',
          password: 'password123',
          displayName: 'HoopsFan',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'HoopsFan',
      });

      // Verify token is valid JWT
      const decoded = jwt.verify(res.body.token, JWT_SECRET);
      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('400: rejects invalid email address', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid email/i);
    });

    it('400: rejects password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/at least 8 characters/i);
    });

    it('409: rejects duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  // =========================================================================
  // POST /api/auth/login
  // =========================================================================
  describe('POST /api/auth/login', () => {
    it('200: logs in with correct credentials and returns JWT', async () => {
      const hash = await bcrypt.hash('password123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: hash,
        displayName: 'HoopsFan',
        createdAt: new Date('2026-08-28T00:00:00Z'),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'HoopsFan',
      });
    });

    it('401: rejects invalid password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: hash,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it('401: rejects non-existent email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it('400: rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: '',
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================================================
  // GET /api/auth/me
  // =========================================================================
  describe('GET /api/auth/me', () => {
    it('200: returns user profile for valid JWT', async () => {
      const token = jwt.sign({ userId: 'user-123', email: 'test@example.com' }, JWT_SECRET);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'HoopsFan',
        createdAt: new Date('2026-08-28T00:00:00Z'),
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'HoopsFan',
      });
    });

    it('200: returns user profile for valid HTTP-only cookie', async () => {
      const token = jwt.sign({ userId: 'user-123', email: 'test@example.com' }, JWT_SECRET);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'HoopsFan',
        createdAt: new Date('2026-08-28T00:00:00Z'),
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `journeyman_token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'HoopsFan',
      });
    });

    it('401: rejects request without Authorization header or auth cookie', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it('401: rejects invalid JWT token in auth cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'journeyman_token=invalid-cookie-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired token/i);
    });

    it('401: rejects invalid JWT token in header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired token/i);
    });

    it('404: returns error if user is not found in database', async () => {
      const token = jwt.sign({ userId: 'user-deleted', email: 'test@example.com' }, JWT_SECRET);
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/user not found/i);
    });
  });

  // =========================================================================
  // POST /api/auth/logout
  // =========================================================================
  describe('POST /api/auth/logout', () => {
    it('200: clears auth and CSRF cookies', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/signed out successfully/i);

      // Check cleared cookies
      const cookies = res.headers['set-cookie'] || [];
      const tokenCookie = cookies.find((c) => c.startsWith('journeyman_token='));
      const csrfCookie = cookies.find((c) => c.startsWith('XSRF-TOKEN='));

      expect(tokenCookie).toBeDefined();
      expect(csrfCookie).toBeDefined();
    });
  });

  // =========================================================================
  // GET /api/auth/csrf & CSRF Protection
  // =========================================================================
  describe('CSRF Protection & /api/auth/csrf', () => {
    it('200: returns csrfToken and sets XSRF-TOKEN cookie', async () => {
      const res = await request(app).get('/api/auth/csrf');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('csrfToken');
      expect(typeof res.body.csrfToken).toBe('string');

      const cookies = res.headers['set-cookie'] || [];
      const csrfCookie = cookies.find((c) => c.startsWith('XSRF-TOKEN='));
      expect(csrfCookie).toBeDefined();
    });

    it('403: rejects mutating request when CSRF cookie is present but header is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Cookie', 'XSRF-TOKEN=secret-csrf-token')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/invalid or missing csrf token/i);
    });

    it('403: rejects mutating request when CSRF header and cookie do not match', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Cookie', 'XSRF-TOKEN=token-aaa')
        .set('X-CSRF-Token', 'token-bbb')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/invalid or missing csrf token/i);
    });

    it('201: allows mutating request when CSRF header and cookie match', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-csrf-1',
        email: 'csrf@example.com',
        displayName: 'CsrfPlayer',
        createdAt: new Date('2026-08-28T00:00:00Z'),
      });

      const res = await request(app)
        .post('/api/auth/register')
        .set('Cookie', 'XSRF-TOKEN=valid-csrf-token')
        .set('X-CSRF-Token', 'valid-csrf-token')
        .send({
          email: 'csrf@example.com',
          password: 'password123',
          displayName: 'CsrfPlayer',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({
        id: 'user-csrf-1',
        email: 'csrf@example.com',
      });
    });
  });

  // =========================================================================
  // POST /api/auth/link
  // =========================================================================
  describe('POST /api/auth/link', () => {
    it('200: migrates anonymous records to authenticated user', async () => {
      const token = jwt.sign({ userId: 'user-reg-123', email: 'test@example.com' }, JWT_SECRET);

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-anon-456',
        anonymousId: 'anon-uuid-456',
        dailyResults: [
          { id: 'result-1', puzzleId: 'puz-1', userId: 'user-anon-456' },
          { id: 'result-2', puzzleId: 'puz-2', userId: 'user-anon-456' },
        ],
      });

      prisma.dailyResult.findMany.mockResolvedValue([
        { puzzleId: 'puz-1' }, // registered user already has puz-1
      ]);

      const res = await request(app)
        .post('/api/auth/link')
        .set('Authorization', `Bearer ${token}`)
        .send({ anonymousId: 'anon-uuid-456' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        migratedCount: 1, // Only puz-2 migrated, puz-1 duplicate deleted
      });

      // Verification of transaction updates
      expect(prisma.dailyResult.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'result-2' },
          data: { userId: 'user-reg-123' },
        })
      );
      expect(prisma.dailyResult.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'result-1' },
        })
      );
      expect(prisma.user.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-anon-456' },
        })
      );
    });

    it('200: returns 0 migrated count when anonymous user does not exist', async () => {
      const token = jwt.sign({ userId: 'user-reg-123', email: 'test@example.com' }, JWT_SECRET);
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/link')
        .set('Authorization', `Bearer ${token}`)
        .send({ anonymousId: 'non-existent-anon' });

      expect(res.status).toBe(200);
      expect(res.body.migratedCount).toBe(0);
    });

    it('401: rejects unauthenticated link attempts', async () => {
      const res = await request(app)
        .post('/api/auth/link')
        .send({ anonymousId: 'anon-uuid' });

      expect(res.status).toBe(401);
    });

    it('400: rejects missing anonymousId', async () => {
      const token = jwt.sign({ userId: 'user-reg-123', email: 'test@example.com' }, JWT_SECRET);

      const res = await request(app)
        .post('/api/auth/link')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
