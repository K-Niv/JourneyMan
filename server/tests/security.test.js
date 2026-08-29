/**
 * server/tests/security.test.js
 * ==============================
 * Integration tests for server hardening, security headers, rate limiters,
 * CORS configuration, payload limits, and error handling.
 */

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// Mock Prisma for safety
vi.mock('../src/lib/prisma.js', () => {
  return {
    default: {
      $disconnect: vi.fn(),
    },
  };
});

describe('Security & Hardening Suite', () => {
  describe('HTTP Security Headers (Helmet)', () => {
    it('sets X-Content-Type-Options: nosniff', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('sets X-Frame-Options: SAMEORIGIN', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('sets Content-Security-Policy header with Wikimedia allowances', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['content-security-policy']).toContain('upload.wikimedia.org');
    });

    it('sets Cross-Origin-Resource-Policy header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });
  });

  describe('CORS Configuration', () => {
    it('handles CORS preflight OPTIONS request with allowed methods and headers', async () => {
      const res = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization,X-Anonymous-Id');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-methods']).toContain('GET');
      expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
    });
  });

  describe('Payload Size Limit (10kb guard)', () => {
    it('rejects JSON payloads exceeding 10kb with 413 Payload Too Large', async () => {
      // Create a payload larger than 10kb (e.g. 15kb string)
      const largePayload = {
        email: 'attacker@example.com',
        password: 'password123',
        bloat: 'x'.repeat(15 * 1024),
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(largePayload);

      expect(res.status).toBe(413);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Routing & Error Masking', () => {
    it('returns 404 JSON for nonexistent endpoints', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not found.' });
    });

    it('returns 200 with ok status for /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
