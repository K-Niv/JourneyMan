import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with intelligent conflict resolution.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 *
 * @param  {...any} inputs - Class values (strings, arrays, objects)
 * @returns {string} Merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
