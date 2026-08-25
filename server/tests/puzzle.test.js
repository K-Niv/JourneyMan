/**
 * server/tests/puzzle.test.js
 * ============================
 * Integration tests for the puzzle API endpoints.
 *
 * Strategy: Prisma Client is mocked via vi.mock so no real DB is required.
 * This lets us exercise the full Express middleware/controller/service stack
 * with deterministic test data without a running PostgreSQL instance.
 *
 * Tests cover:
 *  GET  /api/puzzle/today
 *    - 200: valid puzzle returned without answer
 *    - 404: no puzzle scheduled for today
 *  POST /api/puzzle/guess
 *    - 200: valid guess — feedback returned (no answer while game ongoing)
 *    - 200: final correct guess — answer revealed in response
 *    - 400: guess is not an array
 *    - 400: guess has wrong length
 *    - 400: guess contains non-string elements
 *    - 404: no puzzle for today
 *    - 409: puzzle already completed
 *  Middleware
 *    - X-Anonymous-Id header is sanitised and forwarded
 *    - Absent header → null anonymousId (no crash)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// ---------------------------------------------------------------------------
// Mock Prisma so we never hit a real database
// ---------------------------------------------------------------------------
vi.mock('../src/lib/prisma.js', () => {
  const prismaMock = {
    dailyPuzzle: {
      findUnique: vi.fn(),
    },
    user: {
      upsert: vi.fn(),
    },
    dailyResult: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
  return { default: prismaMock };
});

// Import AFTER mock is set up so the module picks up the mock
import prisma from '../src/lib/prisma.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/**
 * A minimal DailyPuzzle record that mimics a Prisma findUnique result.
 * LeBron James (easy, 2 stints: CLE → MIA).
 */
const MOCK_PUZZLE = {
  id: 'puzzle-001',
  puzzleNumber: 1,
  difficulty: 'easy',
  maxAttempts: 6,
  date: new Date('2026-08-25'),
  player: {
    id: 'player-lebron',
    firstName: 'LeBron',
    lastName: 'James',
    imageUrl: 'https://example.com/lebron.jpg',
    careerStints: [
      {
        stintOrder: 1,
        startYear: 2003,
        endYear: 2010,
        team: { id: 'team-cle', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logoUrl: null },
      },
      {
        stintOrder: 2,
        startYear: 2010,
        endYear: 2014,
        team: { id: 'team-mia', name: 'Miami Heat', abbreviation: 'MIA', logoUrl: null },
      },
    ],
  },
};

/** Correct answer derived from the mock puzzle */
const CORRECT_GUESS = ['team-cle', 'team-mia'];
/** A completely wrong guess */
const WRONG_GUESS = ['team-bos', 'team-gsw'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockPuzzleFound() {
  prisma.dailyPuzzle.findUnique.mockResolvedValue(MOCK_PUZZLE);
}

function mockPuzzleNotFound() {
  prisma.dailyPuzzle.findUnique.mockResolvedValue(null);
}

function mockNoExistingResult() {
  prisma.dailyResult.findUnique.mockResolvedValue(null);
  prisma.dailyResult.create.mockResolvedValue({});
}

function mockExistingResult(overrides = {}) {
  prisma.dailyResult.findUnique.mockResolvedValue({
    id: 'result-001',
    userId: 'user-anon-001',
    puzzleId: 'puzzle-001',
    won: false,
    attempts: 1,
    guesses: [WRONG_GUESS],
    feedback: [['incorrect', 'incorrect']],
    ...overrides,
  });
  prisma.dailyResult.update.mockResolvedValue({});
}

function mockAnonymousUser() {
  prisma.user.upsert.mockResolvedValue({ id: 'user-anon-001', anonymousId: 'test-anon-id' });
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// GET /api/puzzle/today
// ===========================================================================
describe('GET /api/puzzle/today', () => {
  it('200: returns puzzle payload without the answer', async () => {
    mockPuzzleFound();

    const res = await request(app).get('/api/puzzle/today');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      puzzleId: 'puzzle-001',
      puzzleNumber: 1,
      difficulty: 'easy',
      maxAttempts: 6,
      stintCount: 2,
      player: {
        id: 'player-lebron',
        name: 'LeBron James',
        imageUrl: 'https://example.com/lebron.jpg',
      },
    });

    // answer MUST NOT be present in the GET /today response
    expect(res.body).not.toHaveProperty('answer');

    // availableTeams should list de-duplicated teams
    expect(res.body.availableTeams).toHaveLength(2);
    expect(res.body.availableTeams[0]).toMatchObject({ abbreviation: 'CLE' });
    expect(res.body.availableTeams[1]).toMatchObject({ abbreviation: 'MIA' });
  });

  it('200: de-duplicates teams when player returned to the same team', async () => {
    // LeBron-style: CLE → MIA → CLE → LAL
    const puzzle = {
      ...MOCK_PUZZLE,
      player: {
        ...MOCK_PUZZLE.player,
        careerStints: [
          { stintOrder: 1, startYear: 2003, endYear: 2010, team: { id: 'team-cle', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logoUrl: null } },
          { stintOrder: 2, startYear: 2010, endYear: 2014, team: { id: 'team-mia', name: 'Miami Heat',          abbreviation: 'MIA', logoUrl: null } },
          { stintOrder: 3, startYear: 2014, endYear: 2018, team: { id: 'team-cle', name: 'Cleveland Cavaliers', abbreviation: 'CLE', logoUrl: null } },
          { stintOrder: 4, startYear: 2018, endYear: 2025, team: { id: 'team-lal', name: 'Los Angeles Lakers',  abbreviation: 'LAL', logoUrl: null } },
        ],
      },
    };
    prisma.dailyPuzzle.findUnique.mockResolvedValue(puzzle);

    const res = await request(app).get('/api/puzzle/today');

    expect(res.status).toBe(200);
    expect(res.body.stintCount).toBe(4);
    // CLE appears twice in stints but only once in availableTeams
    expect(res.body.availableTeams).toHaveLength(3);
    const abbrevs = res.body.availableTeams.map((t) => t.abbreviation);
    expect(abbrevs).toEqual(['CLE', 'MIA', 'LAL']);
  });

  it('404: returns error when no puzzle is scheduled today', async () => {
    mockPuzzleNotFound();

    const res = await request(app).get('/api/puzzle/today');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/no puzzle scheduled/i);
  });
});

// ===========================================================================
// POST /api/puzzle/guess
// ===========================================================================
describe('POST /api/puzzle/guess', () => {
  // -------------------------------------------------------------------------
  // Successful guesses (no anonymousId — stateless path)
  // -------------------------------------------------------------------------

  it('200: incorrect guess returns feedback without answer', async () => {
    mockPuzzleFound();
    // No anonymous ID → no DB persistence path for user/result
    // prisma.dailyResult.findUnique won't be called

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      puzzleId: 'puzzle-001',
      attemptNumber: 1,
      maxAttempts: 6,
      guess: WRONG_GUESS,
      won: false,
      gameOver: false,
    });
    expect(res.body.feedback).toEqual(['incorrect', 'incorrect']);
    // Answer must NOT be present while game is ongoing
    expect(res.body).not.toHaveProperty('answer');
  });

  it('200: correct guess wins immediately — answer revealed', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: CORRECT_GUESS });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      won: true,
      gameOver: true,
    });
    expect(res.body.feedback).toEqual(['correct', 'correct']);
    // Answer MUST be revealed on game-over
    expect(res.body).toHaveProperty('answer');
    expect(res.body.answer).toHaveLength(2);
    expect(res.body.answer[0]).toMatchObject({ stintOrder: 1, abbreviation: 'CLE' });
    expect(res.body.answer[1]).toMatchObject({ stintOrder: 2, abbreviation: 'MIA' });
  });

  it('200: reaching maxAttempts without winning triggers gameOver', async () => {
    mockPuzzleFound();
    mockAnonymousUser();
    // Simulate 5 prior wrong guesses (one short of max)
    mockExistingResult({
      attempts: 5,
      guesses: Array(5).fill(WRONG_GUESS),
      feedback: Array(5).fill(['incorrect', 'incorrect']),
    });

    const res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', 'test-anon-id')
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(200);
    expect(res.body.attemptNumber).toBe(6);
    expect(res.body.won).toBe(false);
    expect(res.body.gameOver).toBe(true);
    // Answer revealed on game-over loss
    expect(res.body).toHaveProperty('answer');
  });

  // -------------------------------------------------------------------------
  // Anonymous user persistence
  // -------------------------------------------------------------------------

  it('200: persists result when X-Anonymous-Id header is provided', async () => {
    mockPuzzleFound();
    mockAnonymousUser();
    mockNoExistingResult();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', 'test-anon-id')
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(200);
    // Verify upsert and create were called
    expect(prisma.user.upsert).toHaveBeenCalledOnce();
    expect(prisma.dailyResult.create).toHaveBeenCalledOnce();
  });

  it('200: updates existing result on subsequent guess with same anonymousId', async () => {
    mockPuzzleFound();
    mockAnonymousUser();
    mockExistingResult(); // 1 prior guess

    const res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', 'test-anon-id')
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(200);
    expect(res.body.attemptNumber).toBe(2);
    expect(prisma.dailyResult.update).toHaveBeenCalledOnce();
  });

  it('200: no DB writes when no X-Anonymous-Id header is sent', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(200);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(prisma.dailyResult.create).not.toHaveBeenCalled();
    expect(prisma.dailyResult.update).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Validation errors (400)
  // -------------------------------------------------------------------------

  it('400: guess is missing from body', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('400: guess is not an array', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: 'team-cle,team-mia' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/array/i);
  });

  it('400: guess has too few elements', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: ['team-cle'] }); // needs 2

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exactly 2 team IDs/i);
  });

  it('400: guess has too many elements', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: ['team-cle', 'team-mia', 'team-lal'] }); // needs 2

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exactly 2 team IDs/i);
  });

  it('400: guess contains an empty string element', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: ['team-cle', ''] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/non-empty string/i);
  });

  it('400: guess contains a non-string element (number)', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: ['team-cle', 42] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/non-empty string/i);
  });

  it('400: guess is null', async () => {
    mockPuzzleFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: null });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // -------------------------------------------------------------------------
  // Not found (404)
  // -------------------------------------------------------------------------

  it('404: no puzzle scheduled for today', async () => {
    mockPuzzleNotFound();

    const res = await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: CORRECT_GUESS });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no puzzle scheduled/i);
  });

  // -------------------------------------------------------------------------
  // Conflict (409)
  // -------------------------------------------------------------------------

  it('409: puzzle already won — rejects further guesses', async () => {
    mockPuzzleFound();
    mockAnonymousUser();
    // Simulate a previously-won game
    mockExistingResult({
      won: true,
      attempts: 1,
      guesses: [CORRECT_GUESS],
      feedback: [['correct', 'correct']],
    });

    const res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', 'test-anon-id')
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already completed/i);
  });

  it('409: max attempts reached — rejects further guesses', async () => {
    mockPuzzleFound();
    mockAnonymousUser();
    mockExistingResult({
      won: false,
      attempts: 6,
      guesses: Array(6).fill(WRONG_GUESS),
      feedback: Array(6).fill(['incorrect', 'incorrect']),
    });

    const res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', 'test-anon-id')
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(409);
  });
});

// ===========================================================================
// Middleware: anonymousUser
// ===========================================================================
describe('X-Anonymous-Id middleware', () => {
  it('sanitises the header — strips whitespace, max 128 chars', async () => {
    mockPuzzleFound();
    mockNoExistingResult();
    prisma.user.upsert.mockResolvedValue({ id: 'user-x', anonymousId: 'clean-id' });

    const res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', '  clean-id  ')
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(200);
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { anonymousId: 'clean-id' } })
    );
  });

  it('truncates header values longer than 128 characters', async () => {
    mockPuzzleFound();
    mockNoExistingResult();
    const longId = 'a'.repeat(200);
    prisma.user.upsert.mockResolvedValue({ id: 'user-y', anonymousId: 'a'.repeat(128) });

    const res = await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', longId)
      .send({ guess: WRONG_GUESS });

    expect(res.status).toBe(200);
    const calledWith = prisma.user.upsert.mock.calls[0][0];
    expect(calledWith.where.anonymousId.length).toBe(128);
  });

  it('absent header → anonymousId is null → no user DB calls', async () => {
    mockPuzzleFound();

    await request(app)
      .post('/api/puzzle/guess')
      .send({ guess: WRONG_GUESS });

    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });

  it('empty string header → treated as absent → no user DB calls', async () => {
    mockPuzzleFound();

    await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', '')
      .send({ guess: WRONG_GUESS });

    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });

  it('whitespace-only header → treated as absent → no user DB calls', async () => {
    mockPuzzleFound();

    await request(app)
      .post('/api/puzzle/guess')
      .set('X-Anonymous-Id', '   ')
      .send({ guess: WRONG_GUESS });

    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Misc
// ===========================================================================
describe('Misc', () => {
  it('404: unknown route returns JSON error', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
