import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import puzzleRouter from './routes/puzzle.js';
import historyRouter from './routes/history.js';

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoints: POST /api/auth/register, POST /api/auth/login, POST /api/auth/link, GET /api/auth/me
app.use('/api/auth', authRouter);

// Puzzle endpoints: GET /api/puzzle/today, POST /api/puzzle/guess
app.use('/api/puzzle', puzzleRouter);

// History endpoints: GET /api/history, GET /api/history/stats
app.use('/api/history', historyRouter);

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // body-parser sets err.status; custom errors use err.statusCode
  const status = err.statusCode ?? err.status ?? 500;
  // Only expose error details for client errors (4xx).
  // 5xx messages may leak internal details (Prisma, Express internals).
  const message = status < 500
    ? (err.message ?? 'Bad request.')
    : 'Internal server error.';
  res.status(status).json({ error: message });
});

export default app;
