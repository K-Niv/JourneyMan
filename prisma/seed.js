/**
 * prisma/seed.js
 * ==============
 * Seeds the database with:
 *   1. Teams (from seed-data.json)
 *   2. Players (from seed-data.json)
 *   3. CareerStints (from seed-data.json)
 *   4. DailyPuzzles (from puzzles.json)
 *
 * Run with: npx prisma db seed
 *
 * Uses batched createMany (skipDuplicates) for performance — reduces round-trips
 * from ~10,000 individual upserts to ~20 bulk operations. Safe to re-run.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const SEED_DATA_PATH = resolve(__dirname, 'data/seed-data.json');
const PUZZLES_PATH = resolve(__dirname, 'data/puzzles.json');

// Batch size for createMany calls — keeps individual payloads small
const BATCH_SIZE = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    console.error(`\n❌ Could not read ${path}`);
    console.error(`   ${err.message}`);
    if (label === 'seed-data') {
      console.error('   Run: python scripts/fetch-nba-data.py');
    } else {
      console.error('   Run: node scripts/generate-puzzles.js');
    }
    process.exit(1);
  }
}

/** Split an array into chunks of at most `size` elements. */
function chunks(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedTeams(teams) {
  console.log(`\n[1/4] Seeding ${teams.length} teams...`);

  await prisma.team.createMany({
    data: teams.map((t) => ({
      name: t.name,
      abbreviation: t.abbreviation,
      conference: t.conference ?? null,
      division: t.division ?? null,
    })),
    skipDuplicates: true,
  });

  // Update any existing rows that may have changed (e.g. conference/division)
  for (const team of teams) {
    await prisma.team.update({
      where: { abbreviation: team.abbreviation },
      data: {
        name: team.name,
        conference: team.conference ?? null,
        division: team.division ?? null,
      },
    });
  }

  const count = await prisma.team.count();
  console.log(`      ✅ ${count} teams in database.`);
}

async function seedPlayersAndStints(players) {
  console.log(`\n[2-3/4] Seeding ${players.length} players and their career stints...`);

  // --- Step A: bulk-insert all players ---
  console.log('      Inserting players...');
  const playerBatches = chunks(players, BATCH_SIZE);
  for (const batch of playerBatches) {
    await prisma.player.createMany({
      data: batch.map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        imageUrl: p.imageUrl ?? null,
        careerStartYear: p.careerStartYear ?? null,
        careerEndYear: p.careerEndYear ?? null,
      })),
      skipDuplicates: true,
    });
  }

  // Update imageUrl / career years for any players that already existed
  console.log('      Updating existing player records...');
  for (const batch of playerBatches) {
    await Promise.all(
      batch.map((p) =>
        prisma.player.update({
          where: { firstName_lastName: { firstName: p.firstName, lastName: p.lastName } },
          data: {
            imageUrl: p.imageUrl ?? null,
            careerStartYear: p.careerStartYear ?? null,
            careerEndYear: p.careerEndYear ?? null,
          },
        })
      )
    );
  }

  const playerCount = await prisma.player.count();
  console.log(`      ✅ ${playerCount} players in database.`);

  // --- Step B: build lookup maps ---
  console.log('      Building lookup maps...');
  const [teamRows, playerRows] = await Promise.all([
    prisma.team.findMany({ select: { id: true, abbreviation: true } }),
    prisma.player.findMany({ select: { id: true, firstName: true, lastName: true } }),
  ]);

  const teamMap = Object.fromEntries(teamRows.map((t) => [t.abbreviation, t.id]));
  const playerMap = Object.fromEntries(
    playerRows.map((p) => [`${p.firstName}|${p.lastName}`, p.id])
  );

  // --- Step C: bulk-insert all career stints ---
  console.log('      Building stints list...');
  const allStints = [];
  let skippedStints = 0;

  for (const player of players) {
    const playerId = playerMap[`${player.firstName}|${player.lastName}`];
    if (!playerId) continue; // should never happen

    for (const stint of player.stints) {
      const teamId = teamMap[stint.teamAbbreviation];
      if (!teamId) {
        skippedStints++;
        continue;
      }
      allStints.push({
        playerId,
        teamId,
        stintOrder: stint.stintOrder,
        startYear: stint.startYear,
        endYear: stint.endYear,
        gamesPlayed: stint.gamesPlayed,
      });
    }
  }

  console.log(`      Inserting ${allStints.length} career stints in batches...`);
  const stintBatches = chunks(allStints, BATCH_SIZE);
  for (let i = 0; i < stintBatches.length; i++) {
    await prisma.careerStint.createMany({
      data: stintBatches[i],
      skipDuplicates: true,
    });
    console.log(`      ... batch ${i + 1}/${stintBatches.length} done`);
  }

  const stintCount = await prisma.careerStint.count();
  console.log(`      ✅ ${stintCount} career stints in database.`);
  if (skippedStints > 0) {
    console.log(`      ⚠️  ${skippedStints} stints skipped (team not found).`);
  }
}

async function seedDailyPuzzles(puzzleSchedule) {
  console.log(`\n[4/4] Seeding ${puzzleSchedule.length} daily puzzles...`);

  // Build player name → id map
  const playerRows = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  const playerMap = Object.fromEntries(
    playerRows.map((p) => [`${p.firstName}|${p.lastName}`, p.id])
  );

  const puzzleData = [];
  let skipped = 0;

  for (const puzzle of puzzleSchedule) {
    const playerId = playerMap[`${puzzle.playerFirstName}|${puzzle.playerLastName}`];
    if (!playerId) {
      console.warn(
        `      ⚠️  Player not found: ${puzzle.playerFirstName} ${puzzle.playerLastName} — skipping puzzle #${puzzle.puzzleNumber}`
      );
      skipped++;
      continue;
    }
    puzzleData.push({
      date: new Date(puzzle.date),
      puzzleNumber: puzzle.puzzleNumber,
      playerId,
      difficulty: puzzle.difficulty,
      maxAttempts: 6,
    });
  }

  await prisma.dailyPuzzle.createMany({
    data: puzzleData,
    skipDuplicates: true,
  });

  // Update any existing puzzles (in case of re-seed with new data)
  for (const puzzle of puzzleData) {
    await prisma.dailyPuzzle.update({
      where: { date: puzzle.date },
      data: {
        puzzleNumber: puzzle.puzzleNumber,
        playerId: puzzle.playerId,
        difficulty: puzzle.difficulty,
      },
    });
  }

  const count = await prisma.dailyPuzzle.count();
  console.log(`      ✅ ${count} daily puzzles in database.`);
  if (skipped > 0) {
    console.log(`      ⚠️  ${skipped} puzzles skipped.`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('='.repeat(60));
  console.log('JourneyMan — Database Seeder');
  console.log('='.repeat(60));

  const { teams, players } = loadJson(SEED_DATA_PATH, 'seed-data');
  const puzzleSchedule = loadJson(PUZZLES_PATH, 'puzzles');

  console.log(`\nLoaded:`);
  console.log(`  ${teams.length} teams`);
  console.log(`  ${players.length} players`);
  console.log(`  ${puzzleSchedule.length} puzzle entries`);

  await seedTeams(teams);
  await seedPlayersAndStints(players);
  await seedDailyPuzzles(puzzleSchedule);

  // Summary stats
  const counts = await prisma.$transaction([
    prisma.team.count(),
    prisma.player.count(),
    prisma.careerStint.count(),
    prisma.dailyPuzzle.count(),
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('Database Summary:');
  console.log(`  Teams:        ${counts[0]}`);
  console.log(`  Players:      ${counts[1]}`);
  console.log(`  CareerStints: ${counts[2]}`);
  console.log(`  DailyPuzzles: ${counts[3]}`);
  console.log('='.repeat(60));
  console.log('\n✅ Seed complete! Run `npx prisma studio` to inspect the data.');
}

main()
  .catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
