/**
 * server/tests/grading.test.js
 * =============================
 * Unit tests for the JourneyMan grading engine and input validation.
 *
 * Coverage targets:
 *  - gradeGuess()   — all duplicate-team edge cases
 *  - isWin()        — win/loss/edge
 *  - validateGuess() — all invalid input shapes
 *
 * Run: npm run test --workspace=server
 */

import { describe, it, expect } from 'vitest';
import { gradeGuess, isWin } from '../src/domain/grading.js';
import { validateGuess, ValidationError } from '../src/domain/validation.js';

// ---------------------------------------------------------------------------
// Shorthand aliases for cleaner test assertions
// ---------------------------------------------------------------------------
const C = 'correct';
const M = 'misplaced';
const X = 'incorrect';

// ---------------------------------------------------------------------------
// gradeGuess()
// ---------------------------------------------------------------------------
describe('gradeGuess()', () => {
  // --- Basic cases ---

  it('perfect answer — all correct', () => {
    expect(gradeGuess(['LAL', 'MIA', 'CLE'], ['LAL', 'MIA', 'CLE'])).toEqual([C, C, C]);
  });

  it('all wrong teams', () => {
    expect(gradeGuess(['BOS', 'NYK', 'CHI'], ['LAL', 'MIA', 'CLE'])).toEqual([X, X, X]);
  });

  it('all misplaced — correct teams, all wrong positions', () => {
    expect(gradeGuess(['MIA', 'CLE', 'LAL'], ['LAL', 'MIA', 'CLE'])).toEqual([M, M, M]);
  });

  it('mixed — some correct, some incorrect', () => {
    expect(gradeGuess(['LAL', 'NYK', 'CLE'], ['LAL', 'MIA', 'CLE'])).toEqual([C, X, C]);
  });

  it('mixed — some correct, some misplaced, some incorrect', () => {
    expect(gradeGuess(['LAL', 'CLE', 'NYK'], ['LAL', 'MIA', 'CLE'])).toEqual([C, M, X]);
  });

  // --- 2-slot puzzle (Easy difficulty) ---

  it('2-slot: both correct', () => {
    expect(gradeGuess(['CLE', 'LAL'], ['CLE', 'LAL'])).toEqual([C, C]);
  });

  it('2-slot: both misplaced', () => {
    expect(gradeGuess(['LAL', 'CLE'], ['CLE', 'LAL'])).toEqual([M, M]);
  });

  it('2-slot: one correct, one incorrect', () => {
    expect(gradeGuess(['CLE', 'BOS'], ['CLE', 'LAL'])).toEqual([C, X]);
  });

  // --- 6-slot puzzle (Expert difficulty) ---

  it('6-slot: perfect answer', () => {
    const teams = ['OKC', 'HOU', 'BKN', 'PHI', 'LAC', 'PHI'];
    expect(gradeGuess(teams, teams)).toEqual([C, C, C, C, C, C]);
  });

  it('6-slot: all incorrect', () => {
    const guess  = ['ATL', 'ATL', 'ATL', 'ATL', 'ATL', 'ATL'];
    const answer = ['OKC', 'HOU', 'BKN', 'PHI', 'LAC', 'PHI'];
    expect(gradeGuess(guess, answer)).toEqual([X, X, X, X, X, X]);
  });

  // --- Duplicate team in GUESS (single in answer) ---

  it('duplicate in guess: exact match takes priority, second copy is incorrect', () => {
    // Answer: [BOS, LAL], Guess: [LAL, LAL]
    // pos 0: LAL != BOS
    // pos 1: LAL == LAL -> correct (claims answer[1])
    // pos 0: LAL has no unclaimed LAL in answer -> incorrect
    expect(gradeGuess(['LAL', 'LAL'], ['BOS', 'LAL'])).toEqual([X, C]);
  });

  it('duplicate in guess: first copy correct, second copy incorrect', () => {
    // Answer: [LAL, BOS], Guess: [LAL, LAL]
    // pos 0: LAL == LAL -> correct (claims answer[0])
    // pos 1: LAL has no unclaimed LAL in answer -> incorrect
    expect(gradeGuess(['LAL', 'LAL'], ['LAL', 'BOS'])).toEqual([C, X]);
  });

  it('duplicate in guess: only one copy marked misplaced when not in exact position', () => {
    // Answer: [LAL, BOS, MIA], Guess: [BOS, LAL, LAL]
    // pass 1: all positions differ
    // pass 2: BOS -> misplaced (claims answer[1]); first LAL -> misplaced (claims answer[0]); second LAL -> incorrect
    expect(gradeGuess(['BOS', 'LAL', 'LAL'], ['LAL', 'BOS', 'MIA'])).toEqual([M, M, X]);
  });

  it('triple duplicate in guess vs single in answer: one correct, others incorrect', () => {
    // Answer: [LAL, BOS, MIA], Guess: [LAL, LAL, LAL]
    // pass 1: pos 0 LAL == LAL -> correct (claims answer[0])
    // pass 2: remaining LALs have no unclaimed LAL -> incorrect
    expect(gradeGuess(['LAL', 'LAL', 'LAL'], ['LAL', 'BOS', 'MIA'])).toEqual([C, X, X]);
  });

  // --- Duplicate team in ANSWER (single in guess) ---

  it('duplicate in answer: single guess matches exact position, other slot incorrect', () => {
    // Answer: [LAL, LAL], Guess: [LAL, NYK]
    expect(gradeGuess(['LAL', 'NYK'], ['LAL', 'LAL'])).toEqual([C, X]);
  });

  it('duplicate in answer: single guess matches as misplaced if wrong position', () => {
    // Answer: [LAL, BOS, LAL], Guess: [MIA, LAL, GSW]
    // pass 1: no exact matches
    // pass 2: LAL at pos 1 claims one LAL from answer -> misplaced
    expect(gradeGuess(['MIA', 'LAL', 'GSW'], ['LAL', 'BOS', 'LAL'])).toEqual([X, M, X]);
  });

  // --- Duplicate team in BOTH answer and guess ---

  it('duplicate in both: both slots filled with correct team in exact positions', () => {
    // Answer: [LAL, LAL], Guess: [LAL, LAL] — both correct
    expect(gradeGuess(['LAL', 'LAL'], ['LAL', 'LAL'])).toEqual([C, C]);
  });

  it('duplicate in both: one correct, one misplaced', () => {
    // Answer: [LAL, LAL, MIA], Guess: [MIA, LAL, LAL]
    // pass 1: pos 1 LAL == LAL -> correct (claims answer[1])
    // pass 2: pos 0 MIA -> misplaced (claims answer[2]); pos 2 LAL -> misplaced (claims answer[0])
    expect(gradeGuess(['MIA', 'LAL', 'LAL'], ['LAL', 'LAL', 'MIA'])).toEqual([M, C, M]);
  });

  // --- Edge: player had same team as 2 separate stints (LeBron CLE→MIA→CLE→LAL style) ---

  it('returning player in answer: all positions guessed correctly', () => {
    // LeBron-style: CLE at pos 0 and pos 2
    expect(gradeGuess(['CLE', 'MIA', 'CLE'], ['CLE', 'MIA', 'CLE'])).toEqual([C, C, C]);
  });

  it('returning player in answer: mixed correct and misplaced', () => {
    // Answer: [CLE, MIA, CLE], Guess: [MIA, CLE, CLE]
    // pass 1: pos 2 CLE == CLE -> correct (claims answer[2])
    // pass 2: pos 0 MIA -> misplaced (claims answer[1]); pos 1 CLE -> misplaced (claims answer[0])
    expect(gradeGuess(['MIA', 'CLE', 'CLE'], ['CLE', 'MIA', 'CLE'])).toEqual([M, M, C]);
  });

  it('returning player in answer: single guess provides only one instance', () => {
    // Answer: [CLE, MIA, CLE], Guess: [CLE, MIA, BOS]
    expect(gradeGuess(['CLE', 'MIA', 'BOS'], ['CLE', 'MIA', 'CLE'])).toEqual([C, C, X]);
  });

  // --- Error case ---

  it('throws when guess length does not match answer length', () => {
    expect(() => gradeGuess(['LAL', 'BOS'], ['LAL', 'BOS', 'MIA'])).toThrow(
      'Guess length 2 does not match answer length 3'
    );
  });

  it('throws with correct lengths in error message', () => {
    expect(() => gradeGuess(['LAL'], ['LAL', 'BOS'])).toThrowError(/Guess length 1.*answer length 2/);
  });
});

// ---------------------------------------------------------------------------
// isWin()
// ---------------------------------------------------------------------------
describe('isWin()', () => {
  it('returns true when all slots are correct', () => {
    expect(isWin([C, C, C])).toBe(true);
  });

  it('returns false when any slot is misplaced', () => {
    expect(isWin([C, M, C])).toBe(false);
  });

  it('returns false when any slot is incorrect', () => {
    expect(isWin([C, C, X])).toBe(false);
  });

  it('returns false for all incorrect', () => {
    expect(isWin([X, X, X])).toBe(false);
  });

  it('returns false for all misplaced', () => {
    expect(isWin([M, M, M])).toBe(false);
  });

  it('returns true for single-slot correct', () => {
    expect(isWin([C])).toBe(true);
  });

  it('returns false for single-slot incorrect', () => {
    expect(isWin([X])).toBe(false);
  });

  it('returns false for empty array (no win without a guess)', () => {
    expect(isWin([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateGuess()
// ---------------------------------------------------------------------------
describe('validateGuess()', () => {
  it('passes for a valid guess matching stintCount', () => {
    expect(() => validateGuess(['LAL', 'MIA', 'CLE'], 3)).not.toThrow();
  });

  it('passes for a 2-element valid guess', () => {
    expect(() => validateGuess(['BOS', 'NYK'], 2)).not.toThrow();
  });

  it('throws ValidationError when guess is not an array', () => {
    expect(() => validateGuess('LAL,MIA', 2)).toThrow(ValidationError);
    expect(() => validateGuess('LAL,MIA', 2)).toThrow('Guess must be an array');
  });

  it('throws ValidationError when guess is null', () => {
    expect(() => validateGuess(null, 2)).toThrow(ValidationError);
  });

  it('throws ValidationError when guess is undefined', () => {
    expect(() => validateGuess(undefined, 2)).toThrow(ValidationError);
  });

  it('throws ValidationError when guess is a plain object', () => {
    expect(() => validateGuess({ 0: 'LAL', 1: 'BOS' }, 2)).toThrow(ValidationError);
  });

  it('throws ValidationError when guess is too short', () => {
    expect(() => validateGuess(['LAL'], 3)).toThrow(ValidationError);
    expect(() => validateGuess(['LAL'], 3)).toThrow('exactly 3 team IDs');
  });

  it('throws ValidationError when guess is too long', () => {
    expect(() => validateGuess(['LAL', 'BOS', 'MIA', 'OKC'], 3)).toThrow(ValidationError);
    expect(() => validateGuess(['LAL', 'BOS', 'MIA', 'OKC'], 3)).toThrow('exactly 3 team IDs');
  });

  it('throws ValidationError when guess is empty array and stintCount is non-zero', () => {
    expect(() => validateGuess([], 2)).toThrow(ValidationError);
    expect(() => validateGuess([], 2)).toThrow('exactly 2 team IDs');
  });

  it('throws ValidationError when an element is an empty string', () => {
    expect(() => validateGuess(['LAL', '', 'CLE'], 3)).toThrow(ValidationError);
    expect(() => validateGuess(['LAL', '', 'CLE'], 3)).toThrow('non-empty string');
  });

  it('throws ValidationError when an element is a whitespace-only string', () => {
    expect(() => validateGuess(['LAL', '   ', 'CLE'], 3)).toThrow(ValidationError);
  });

  it('throws ValidationError when an element is a number', () => {
    expect(() => validateGuess(['LAL', 42, 'CLE'], 3)).toThrow(ValidationError);
    expect(() => validateGuess(['LAL', 42, 'CLE'], 3)).toThrow('index 1');
  });

  it('throws ValidationError when an element is null', () => {
    expect(() => validateGuess([null, 'BOS'], 2)).toThrow(ValidationError);
    expect(() => validateGuess([null, 'BOS'], 2)).toThrow('index 0');
  });

  it('throws ValidationError when an element is undefined', () => {
    expect(() => validateGuess(['LAL', undefined], 2)).toThrow(ValidationError);
  });

  it('throws ValidationError when an element is an object', () => {
    expect(() => validateGuess([{ id: 'LAL' }, 'BOS'], 2)).toThrow(ValidationError);
  });

  it('ValidationError has statusCode 400', () => {
    try {
      validateGuess(null, 2);
    } catch (err) {
      expect(err.statusCode).toBe(400);
      expect(err.name).toBe('ValidationError');
    }
  });

  it('error message includes the received count when wrong length', () => {
    expect(() => validateGuess(['LAL'], 3)).toThrow('received 1');
  });

  it('throws ValidationError when an element is a BigInt', () => {
    expect(() => validateGuess(['LAL', 100n], 2)).toThrow(ValidationError);
  });

  it('throws ValidationError when an element is a circular object', () => {
    const circular = {};
    circular.self = circular;
    expect(() => validateGuess(['LAL', circular], 2)).toThrow(ValidationError);
  });

  it('singular "team ID" (not plural) when stintCount is 1', () => {
    expect(() => validateGuess([], 1)).toThrow('1 team ID ');
  });
});
