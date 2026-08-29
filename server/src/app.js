import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { config } from './config/env.js';
import { helmetMiddleware, corsMiddleware } from './middleware/security.js';
import { generalLimiter } from './middleware/rateLimiter.js';

import authRouter from './routes/auth.js';
import puzzleRouter from './routes/puzzle.js';
import historyRouter from './routes/history.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust first proxy hop (Render, Railway, Fly.io, Heroku, Nginx)
app.set('trust proxy', 1);

// Security Headers (Helmet) & CORS
app.use(helmetMiddleware);
app.use(corsMiddleware);

// JSON body parser with strict 10kb payload limit to prevent large body attacks
app.use(express.json({ limit: '10kb' }));

// Apply general rate limiter across all /api routes
app.use('/api', generalLimiter);

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// Health Check Endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/auth/link, GET /api/auth/me
app.use('/api/auth', authRouter);

// Puzzle endpoints: GET /api/puzzle/today, POST /api/puzzle/guess
app.use('/api/puzzle', puzzleRouter);

// History endpoints: GET /api/history, GET /api/history/stats
app.use('/api/history', historyRouter);

// ---------------------------------------------------------------------------
// Production Static File Serving (Co-hosted Client SPA)
// ---------------------------------------------------------------------------
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (config.isProd && fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for non-API requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ---------------------------------------------------------------------------
// 404 catch-all for unmatched API or static routes
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // body-parser sets err.status (e.g. 413 for payload too large); custom errors use err.statusCode
  const status = err.statusCode ?? err.status ?? 500;
  // Only expose error details for client errors (4xx).
  // 5xx messages may leak internal details (Prisma, Express internals).
  const message = status < 500
    ? (err.message ?? 'Bad request.')
    : 'Internal server error.';
  res.status(status).json({ error: message });
});

export default app;
