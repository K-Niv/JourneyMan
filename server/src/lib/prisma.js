/**
 * server/src/lib/prisma.js
 * ========================
 * Singleton Prisma Client instance.
 *
 * In development, attaches the client to `globalThis` to prevent
 * new connections on every hot-reload (Node module cache is cleared
 * by nodemon/tsx but globalThis persists).
 *
 * Usage:
 *   import prisma from '../lib/prisma.js';
 */

import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
