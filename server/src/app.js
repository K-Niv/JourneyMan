import express from 'express';
import cors from 'cors';

import puzzleRouter from './routes/puzzle.js';

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

// Puzzle endpoints: GET /api/puzzle/today, POST /api/puzzle/guess
app.use('/api/puzzle', puzzleRouter);

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
  res.status(status).json({ error: err.message ?? 'Internal server error.' });
});

export default app;
