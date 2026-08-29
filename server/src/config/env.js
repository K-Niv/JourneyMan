/**
 * server/src/config/env.js
 * =========================
 * Environment configuration loader and runtime validator.
 * Validates essential environment variables on startup and exports
 * strongly-typed configuration options with safe fallbacks.
 */

import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isTest = NODE_ENV === 'test';
const isProd = NODE_ENV === 'production';

const PORT = parseInt(process.env.PORT || '3001', 10);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

if (isProd && JWT_SECRET === 'super-secret-jwt-key-change-in-production') {
  console.warn(
    '⚠️ [SECURITY WARNING] Default JWT_SECRET is active in production environment! Set a cryptographically secure JWT_SECRET.'
  );
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL && !isTest) {
  console.warn(
    '⚠️ [CONFIG WARNING] DATABASE_URL is not set. Database operations will fail unless configured.'
  );
}

const CLIENT_URL = process.env.CLIENT_URL || process.env.CORS_ORIGIN || '';
const isCrossSite = isProd;
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || (isProd ? 'none' : 'lax');

export const config = {
  port: PORT,
  nodeEnv: NODE_ENV,
  isTest,
  isProd,
  jwtSecret: JWT_SECRET,
  databaseUrl: DATABASE_URL,
  clientUrl: CLIENT_URL,
  isCrossSite,
  cookieSameSite: COOKIE_SAME_SITE,
  // Rate limiting config
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED ? process.env.RATE_LIMIT_ENABLED === 'true' : !isTest,
    generalWindowMs: 15 * 60 * 1000, // 15 minutes
    generalMax: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '300', 10), // 300 requests per 15 min
    authWindowMs: 15 * 60 * 1000, // 15 minutes
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '15', 10), // 15 login/register attempts per 15 min
    guessWindowMs: 60 * 1000, // 1 minute
    guessMax: parseInt(process.env.RATE_LIMIT_GUESS_MAX || '45', 10), // 45 guess submissions per min
  },
};

export default config;
