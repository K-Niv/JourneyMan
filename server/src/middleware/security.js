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
 * Determine allowed origins for CORS.
 */
const getCorsOrigins = () => {
  const allowed = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173',
  ];

  if (config.clientUrl) {
    const customOrigins = config.clientUrl.split(',').map((o) => o.trim());
    allowed.push(...customOrigins);
  }

  return allowed;
};

/**
 * CORS Middleware configured with whitelist support and preflight caching.
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowedOrigins = getCorsOrigins();
    if (allowedOrigins.includes(origin) || !config.isProd) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS policy.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Anonymous-Id'],
  maxAge: 86400, // 24 hours preflight cache
});
