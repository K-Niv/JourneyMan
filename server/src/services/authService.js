/**
 * server/src/services/authService.js
 * ===================================
 * Business logic orchestration for user authentication and account linking.
 *
 * Responsibilities:
 *  - User registration with bcrypt password hashing
 *  - User login & credential verification
 *  - JWT token generation & payload signing
 *  - Anonymous session history migration & account linking
 *  - User profile retrieval
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

/**
 * Standard email validation regex.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper to generate JWT token for a user.
 *
 * @param {object} user
 * @returns {string} JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Register a new user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} [displayName]
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerUser(email, password, displayName) {
  // 1. Validation
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    const err = new Error('A valid email address is required.');
    err.statusCode = 400;
    throw err;
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    const err = new Error('Password must be at least 8 characters long.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 2. Check for duplicate email
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. Create user record
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      displayName: displayName && typeof displayName === 'string' ? displayName.trim() : null,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
    },
  });

  // 5. Sign token
  const token = generateToken(user);

  return { user, token };
}

/**
 * Authenticate a user with email and password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser(email, password) {
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    const err = new Error('Email and password are required.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.passwordHash) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const userProfile = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };

  const token = generateToken(userProfile);

  return { user: userProfile, token };
}

/**
 * Fetch a user's profile by their user ID.
 *
 * @param {string} userId
 * @returns {Promise<object>} User profile
 */
export async function getUserProfile(userId) {
  if (!userId) {
    const err = new Error('User ID is required.');
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
    },
  });

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

/**
 * Migrate game history from an anonymous session to a registered user account.
 *
 * @param {string} userId        - Authenticated user UUID
 * @param {string} anonymousId   - Session UUID from X-Anonymous-Id
 * @returns {Promise<{ message: string, migratedCount: number }>}
 */
export async function linkAnonymousAccount(userId, anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string') {
    const err = new Error('A valid anonymousId is required.');
    err.statusCode = 400;
    throw err;
  }

  const anonUser = await prisma.user.findUnique({
    where: { anonymousId: anonymousId.trim() },
    include: { dailyResults: true },
  });

  if (!anonUser) {
    return { message: 'No anonymous session found to link.', migratedCount: 0 };
  }

  if (anonUser.id === userId) {
    return { message: 'Anonymous session already matches this account.', migratedCount: 0 };
  }

  // Find existing results for the target registered user to avoid duplicate puzzle conflict
  const existingRegisteredResults = await prisma.dailyResult.findMany({
    where: { userId },
    select: { puzzleId: true },
  });
  const existingPuzzleIds = new Set(existingRegisteredResults.map((r) => r.puzzleId));

  let migratedCount = 0;

  // Run migration in a transaction
  await prisma.$transaction(async (tx) => {
    for (const result of anonUser.dailyResults) {
      if (!existingPuzzleIds.has(result.puzzleId)) {
        // Migrate to target registered user
        await tx.dailyResult.update({
          where: { id: result.id },
          data: { userId },
        });
        migratedCount += 1;
      } else {
        // Registered user already played this puzzle; delete the anon copy
        await tx.dailyResult.delete({
          where: { id: result.id },
        });
      }
    }

    // Delete the anonymous shadow user record
    await tx.user.delete({
      where: { id: anonUser.id },
    });
  });

  return {
    message: 'Anonymous account history successfully linked.',
    migratedCount,
  };
}
