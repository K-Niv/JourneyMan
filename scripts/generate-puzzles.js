/**
 * generate-puzzles.js
 * ====================
 * Reads prisma/data/seed-data.json and pre-generates a daily puzzle schedule.
 *
 * Algorithm:
 *   1. Group players into 4 difficulty buckets by stint count.
 *   2. Fisher-Yates shuffle each bucket independently.
 *   3. For each calendar day, pick a difficulty that differs from the previous day.
 *   4. Pop next player from that bucket; reshuffle and cycle when exhausted.
 *   5. Write output to prisma/data/puzzles.json.
 *
 * Usage:
 *   node scripts/generate-puzzles.js
 *   node scripts/generate-puzzles.js --days=365  (default: 180)
 *   node scripts/generate-puzzles.js --start=2026-09-01
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.slice(2).split('=');
      return [k, v];
    })
);

const DAYS = parseInt(args.days ?? '180', 10);
const START_DATE = args.start ?? new Date().toISOString().slice(0, 10); // Today UTC

const SEED_DATA_PATH = resolve(__dirname, '../prisma/data/seed-data.json');
const OUTPUT_PATH = resolve(__dirname, '../prisma/data/puzzles.json');

// ---------------------------------------------------------------------------
// Difficulty mapping (mirrors shared/constants.js)
// ---------------------------------------------------------------------------
const DIFFICULTY = {
  EASY: 'easy', // 2 stints
  MEDIUM: 'medium', // 3 stints
  HARD: 'hard', // 4–5 stints
  EXPERT: 'expert', // 6+ stints
};

function getDifficulty(stintCount) {
  if (stintCount <= 2) return DIFFICULTY.EASY;
  if (stintCount === 3) return DIFFICULTY.MEDIUM;
  if (stintCount <= 5) return DIFFICULTY.HARD;
  return DIFFICULTY.EXPERT;
}

// ---------------------------------------------------------------------------
// Fisher-Yates shuffle (in-place)
// ---------------------------------------------------------------------------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Circular bucket: pops from front, reshuffles when exhausted
// ---------------------------------------------------------------------------
class CircularBucket {
  constructor(players, difficulty) {
    this.difficulty = difficulty;
    this.all = [...players]; // master copy
    this.pool = shuffle([...players]);
    this.cycleCount = 0;
  }

  isEmpty() {
    return this.all.length === 0;
  }

  next() {
    if (this.pool.length === 0) {
      // Reshuffle and restart — players may repeat after full pool exhausted
      this.pool = shuffle([...this.all]);
      this.cycleCount++;
      console.log(
        `  ♻️  ${this.difficulty} bucket exhausted (cycle ${this.cycleCount}). Reshuffling ${this.all.length} players.`
      );
    }
    return this.pool.shift();
  }
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log('='.repeat(60));
  console.log('JourneyMan — Puzzle Schedule Generator');
  console.log('='.repeat(60));

  // Load seed data
  let seedData;
  try {
    seedData = JSON.parse(readFileSync(SEED_DATA_PATH, 'utf-8'));
  } catch (err) {
    console.error(`\n❌ Could not read ${SEED_DATA_PATH}`);
    console.error('   Run scripts/fetch-nba-data.py first.\n');
    process.exit(1);
  }

  const { players } = seedData;
  console.log(`\nLoaded ${players.length} players from seed-data.json`);

  // Group into difficulty buckets
  const buckets = {
    [DIFFICULTY.EASY]: [],
    [DIFFICULTY.MEDIUM]: [],
    [DIFFICULTY.HARD]: [],
    [DIFFICULTY.EXPERT]: [],
  };

  for (const player of players) {
    const stintCount = player.stints.length;
    const diff = getDifficulty(stintCount);
    buckets[diff].push(player);
  }

  console.log('\nDifficulty bucket sizes:');
  for (const [diff, arr] of Object.entries(buckets)) {
    console.log(`  ${diff.padEnd(8)} ${arr.length} players`);
  }

  // Build circular buckets
  const circularBuckets = {};
  for (const [diff, arr] of Object.entries(buckets)) {
    circularBuckets[diff] = new CircularBucket(arr, diff);
  }

  // Difficulty rotation: ensure no two consecutive days share difficulty
  // Strategy: maintain a queue of 4 difficulties, rotate ensuring prev !== current
  const ALL_DIFFICULTIES = Object.values(DIFFICULTY).filter(
    (d) => !circularBuckets[d].isEmpty()
  );

  if (ALL_DIFFICULTIES.length === 0) {
    console.error('\n❌ No eligible players found. Check seed-data.json.');
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Generate puzzle schedule
  // ---------------------------------------------------------------------------
  console.log(`\nGenerating ${DAYS} days of puzzles starting ${START_DATE}...`);

  const puzzles = [];
  let prevDifficulty = null;

  for (let i = 0; i < DAYS; i++) {
    const date = addDays(START_DATE, i);
    const puzzleNumber = i + 1;

    // Pick a difficulty that:
    //   (a) differs from prevDifficulty
    //   (b) has players available
    let chosenDiff = null;

    // Available difficulties (non-empty and different from previous)
    const candidates = ALL_DIFFICULTIES.filter((d) => d !== prevDifficulty);

    if (candidates.length === 0) {
      // Edge case: only one difficulty exists — forced to repeat
      chosenDiff = ALL_DIFFICULTIES[0];
    } else {
      // Pseudo-random pick from candidates (weighted toward variety)
      chosenDiff = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const player = circularBuckets[chosenDiff].next();
    prevDifficulty = chosenDiff;

    puzzles.push({
      date,
      puzzleNumber,
      playerFirstName: player.firstName,
      playerLastName: player.lastName,
      difficulty: chosenDiff,
    });
  }

  // Difficulty distribution summary
  const dist = {};
  for (const p of puzzles) {
    dist[p.difficulty] = (dist[p.difficulty] ?? 0) + 1;
  }
  console.log('\nDifficulty distribution in generated schedule:');
  for (const [diff, count] of Object.entries(dist)) {
    const pct = ((count / DAYS) * 100).toFixed(1);
    console.log(`  ${diff.padEnd(8)} ${count} days (${pct}%)`);
  }

  // Verify no consecutive same-difficulty days
  let consecutiveViolations = 0;
  for (let i = 1; i < puzzles.length; i++) {
    if (puzzles[i].difficulty === puzzles[i - 1].difficulty) {
      consecutiveViolations++;
    }
  }
  if (consecutiveViolations > 0) {
    console.warn(`\n⚠️  ${consecutiveViolations} consecutive same-difficulty days detected.`);
  } else {
    console.log('\n✅ No consecutive same-difficulty days.');
  }

  // Write output
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(puzzles, null, 2));

  console.log(`\n✅ Written ${puzzles.length} puzzles to ${OUTPUT_PATH}`);
  console.log('\nNext step: npx prisma db seed');
}

main();
