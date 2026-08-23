export const MAX_ATTEMPTS = 6;

export const FEEDBACK = {
  CORRECT: 'correct',
  MISPLACED: 'misplaced',
  INCORRECT: 'incorrect',
};

export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
};

export function getDifficulty(stintCount) {
  if (stintCount <= 2) return DIFFICULTY.EASY;
  if (stintCount === 3) return DIFFICULTY.MEDIUM;
  if (stintCount <= 5) return DIFFICULTY.HARD;
  return DIFFICULTY.EXPERT;
}
