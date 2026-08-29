import { describe, it, expect } from 'vitest';
import {
  MAX_ATTEMPTS,
  FEEDBACK,
  DIFFICULTY,
  getDifficulty,
} from './constants.js';

describe('Shared Constants & Logic', () => {
  describe('MAX_ATTEMPTS', () => {
    it('is defined and equal to 6', () => {
      expect(MAX_ATTEMPTS).toBe(6);
    });
  });

  describe('FEEDBACK', () => {
    it('defines expected feedback values', () => {
      expect(FEEDBACK).toEqual({
        CORRECT: 'correct',
        MISPLACED: 'misplaced',
        INCORRECT: 'incorrect',
      });
    });
  });

  describe('DIFFICULTY', () => {
    it('defines 4 difficulty tiers', () => {
      expect(DIFFICULTY).toEqual({
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard',
        EXPERT: 'expert',
      });
    });
  });

  describe('getDifficulty(stintCount)', () => {
    it('returns EASY for stint count <= 2', () => {
      expect(getDifficulty(0)).toBe(DIFFICULTY.EASY);
      expect(getDifficulty(1)).toBe(DIFFICULTY.EASY);
      expect(getDifficulty(2)).toBe(DIFFICULTY.EASY);
    });

    it('returns MEDIUM for stint count equal to 3', () => {
      expect(getDifficulty(3)).toBe(DIFFICULTY.MEDIUM);
    });

    it('returns HARD for stint count 4 or 5', () => {
      expect(getDifficulty(4)).toBe(DIFFICULTY.HARD);
      expect(getDifficulty(5)).toBe(DIFFICULTY.HARD);
    });

    it('returns EXPERT for stint count 6 or greater', () => {
      expect(getDifficulty(6)).toBe(DIFFICULTY.EXPERT);
      expect(getDifficulty(7)).toBe(DIFFICULTY.EXPERT);
      expect(getDifficulty(10)).toBe(DIFFICULTY.EXPERT);
    });
  });
});
