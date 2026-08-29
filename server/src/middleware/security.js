/**
 * server/src/middleware/security.js
 * ==================================
 * Configures Helmet security headers and CORS policy for the Express API.
 */

import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config/env.js';

/**
 * Configure Helmet with custom Content Security Policy (CSP) and security headers.
 * Allows images from Wikimedia Commons for player headshots.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://upload.wikimedia.org',
        'https://*.wikimedia.org',
        'https://*.nba.com',
      ],
      connectSrc: ["'self'", config.clientUrl].filter(Boolean),
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: config.isProd ? [] : null,
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
});

/**
 * Check whether an origin is allowed by CORS policy.
 * @param {string|undefined} origin
 * @returns {boolean}
 */
export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, health checks)
  if (!origin) return true;

  // In non-production environments, allow all origins for easy development & testing
  if (!config.isProd) return true;

  const normalizedOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();

  // Allow standard localhost / 127.0.0.1 ports
  const localRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  if (localRegex.test(normalizedOrigin)) {
    return true;
  }

  // Allow all Vercel domains (production domains, custom subdomains, preview branches)
  const vercelRegex = /^https:\/\/[a-z0-9-_.]+\.vercel\.app$/;
  if (vercelRegex.test(normalizedOrigin) || normalizedOrigin === 'https://vercel.app') {
    return true;
  }

  // Allow configured CLIENT_URL(s)
  if (config.clientUrl) {
    const customOrigins = config.clientUrl
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, '').toLowerCase())
      .filter(Boolean);

    for (const allowed of customOrigins) {
      if (
        normalizedOrigin === allowed ||
        normalizedOrigin === `https://${allowed}` ||
        normalizedOrigin === `http://${allowed}`
      ) {
        return true;
      }
    }
  }

  return false;
};

/**
 * CORS Middleware configured with whitelist support, preflight caching, and credential exchange.
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Anonymous-Id',
    'X-CSRF-Token',
    'X-XSRF-Token',
  ],
  exposedHeaders: ['X-CSRF-Token', 'X-XSRF-Token', 'Set-Cookie'],
  maxAge: 86400, // 24 hours preflight cache
});
