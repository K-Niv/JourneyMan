#!/usr/bin/env node
/**
 * fix-seed-data.js
 * ================
 * One-time cleanup script that fixes 3 bugs in the raw seed-data.json:
 *
 *  Bug 1 — TOT rows: NBA API emits a "TOT" aggregate row when a player is
 *           traded mid-season. filter them out before building stints.
 *
 *  Bug 2 — Defunct/historical teams: seed-data.json has 75 "teams" including
 *           pre-merger franchises (AND, BAL, BLT, TOT …). Keep only the 30
 *           current NBA franchises in the teams list.
 *
 *  Bug 3 — Missing images: Wikipedia fetch returned 0/3180 URLs.
 *           Replace with NBA CDN headshots which are 100% reliable:
 *           https://cdn.nba.com/headshots/nba/latest/260x190/{playerId}.png
 *           Player IDs are embedded in the raw data that commonallplayers
 *           returns — but since we didn't store them, we use the player's
 *           full name to look them up from the nba_api static players list.
 *           We store a name→id map from the already-downloaded data by
 *           reading the original JSON + the nba_api static player list baked
 *           into nba_api's Python package. Because that's a Python dependency
 *           we can't call from Node, we instead use a fallback approach:
 *           write imageUrl = null for now (it was null before) and leave a
 *           clear TODO. The real fix is in the Python script for future runs.
 *
 *  Additionally:
 *  - Filters out players whose stints reference ONLY defunct team codes
 *    (i.e. teams not in the current 30) — these are pre-NBA-merger players
 *    with no recognisable teams and are useless as puzzle subjects.
 *  - Re-numbers stintOrder after TOT rows are removed.
 *  - Recounts/rebuilds the teams list from only real abbreviations.
 *
 * Usage:
 *   node scripts/fix-seed-data.js
 *
 * Output: overwrites prisma/data/seed-data.json in place.
 *         A backup is saved to prisma/data/seed-data.json.bak
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'prisma', 'data', 'seed-data.json');
const BACKUP_PATH = DATA_PATH + '.bak';

// ---------------------------------------------------------------------------
// The 30 current NBA franchises
// ---------------------------------------------------------------------------
const CURRENT_TEAMS = {
  ATL: { name: 'Atlanta Hawks',          conference: 'Eastern', division: 'Southeast' },
  BOS: { name: 'Boston Celtics',         conference: 'Eastern', division: 'Atlantic'  },
  BKN: { name: 'Brooklyn Nets',          conference: 'Eastern', division: 'Atlantic'  },
  CHA: { name: 'Charlotte Hornets',      conference: 'Eastern', division: 'Southeast' },
  CHI: { name: 'Chicago Bulls',          conference: 'Eastern', division: 'Central'   },
  CLE: { name: 'Cleveland Cavaliers',    conference: 'Eastern', division: 'Central'   },
  DAL: { name: 'Dallas Mavericks',       conference: 'Western', division: 'Southwest' },
  DEN: { name: 'Denver Nuggets',         conference: 'Western', division: 'Northwest' },
  DET: { name: 'Detroit Pistons',        conference: 'Eastern', division: 'Central'   },
  GSW: { name: 'Golden State Warriors',  conference: 'Western', division: 'Pacific'   },
  HOU: { name: 'Houston Rockets',        conference: 'Western', division: 'Southwest' },
  IND: { name: 'Indiana Pacers',         conference: 'Eastern', division: 'Central'   },
  LAC: { name: 'LA Clippers',            conference: 'Western', division: 'Pacific'   },
  LAL: { name: 'Los Angeles Lakers',     conference: 'Western', division: 'Pacific'   },
  MEM: { name: 'Memphis Grizzlies',      conference: 'Western', division: 'Southwest' },
  MIA: { name: 'Miami Heat',             conference: 'Eastern', division: 'Southeast' },
  MIL: { name: 'Milwaukee Bucks',        conference: 'Eastern', division: 'Central'   },
  MIN: { name: 'Minnesota Timberwolves', conference: 'Western', division: 'Northwest' },
  NOP: { name: 'New Orleans Pelicans',   conference: 'Western', division: 'Southwest' },
  NYK: { name: 'New York Knicks',        conference: 'Eastern', division: 'Atlantic'  },
  OKC: { name: 'Oklahoma City Thunder',  conference: 'Western', division: 'Northwest' },
  ORL: { name: 'Orlando Magic',          conference: 'Eastern', division: 'Southeast' },
  PHI: { name: 'Philadelphia 76ers',     conference: 'Eastern', division: 'Atlantic'  },
  PHX: { name: 'Phoenix Suns',           conference: 'Western', division: 'Pacific'   },
  POR: { name: 'Portland Trail Blazers', conference: 'Western', division: 'Northwest' },
  SAC: { name: 'Sacramento Kings',       conference: 'Western', division: 'Pacific'   },
  SAS: { name: 'San Antonio Spurs',      conference: 'Western', division: 'Southwest' },
  TOR: { name: 'Toronto Raptors',        conference: 'Eastern', division: 'Atlantic'  },
  UTA: { name: 'Utah Jazz',              conference: 'Western', division: 'Northwest' },
  WAS: { name: 'Washington Wizards',     conference: 'Eastern', division: 'Southeast' },
};

// Historical abbreviations that map to a current franchise (relocations/renames).
// These are kept in player stints but displayed as the modern team name.
const HISTORICAL_TO_CURRENT = {
  // Seattle SuperSonics → Oklahoma City Thunder
  SEA: 'OKC',
  // New Jersey Nets → Brooklyn Nets
  NJN: 'BKN',
  // New Orleans Hornets / Oklahoma City Hornets → New Orleans Pelicans
  NOH: 'NOP',
  NOK: 'NOP',
  // Charlotte Bobcats → Charlotte Hornets
  CHO: 'CHA',
  // Vancouver Grizzlies → Memphis Grizzlies
  VAN: 'MEM',
  // New Orleans Jazz → Utah Jazz
  NOJ: 'UTA',
  // Kansas City Kings → Sacramento Kings
  KCK: 'SAC',
  // San Diego Clippers → LA Clippers
  SDC: 'LAC',
  // San Diego Rockets → Houston Rockets
  SDR: 'HOU',
  // Buffalo Braves → LA Clippers (via San Diego)
  BUF: 'LAC',
  // Capital Bullets / Washington Bullets → Washington Wizards
  CAP: 'WAS',
  WSB: 'WAS',
  // Philadelphia Warriors → Golden State Warriors
  PHW: 'GSW',
  // Fort Wayne Pistons → Detroit Pistons
  FTW: 'DET',
  // Tri-Cities Blackhawks / St. Louis Hawks / Milwaukee Hawks → Atlanta Hawks
  TRI: 'ATL',
  STL: 'ATL',
  MLH: 'ATL',
  // Syracuse Nationals → Philadelphia 76ers
  SYR: 'PHI',
  // Minneapolis Lakers → Los Angeles Lakers
  MNL: 'LAL',
  // Rochester Royals → Sacramento Kings
  ROC: 'SAC',
  // Indiana Pacers (ABA) — keep as IND
  // New Orleans Jazz (pre-UTA) → UTA already mapped above
  // Denver Nuggets (ABA) - already DNV? keep if seen
  DNV: 'DEN',
  // New Jersey Americans → NJN (already mapped)
  // Chicago Packers/Zephyrs → Washington Wizards
  CHP: 'WAS',
  CHZ: 'WAS',
  // Baltimore Bullets → Washington Wizards
  BAL: 'WAS',
  // Cincinnati Royals → Sacramento Kings
  CIN: 'SAC',
  // Golden State Warriors previous abbr
  SFW: 'GSW',
  // Cleveland Cavaliers old abbr
  // Houston Rockets (San Diego era already mapped SDR)
  // Utah Jazz abbreviations
  // Memphis Grizzlies Vancouver era already mapped
  // New Orleans Pelicans old abbr
  NOO: 'NOP',
  // Charlotte (CHH = Charlotte Hornets original)
  CHH: 'CHA',
  // Portland (already POR, fine)
  // Phoenix (already PHX, fine)
  // PHL → PHI
  PHL: 'PHI',
  // Minneapolis
};

// All valid abbreviations we accept in stints (current 30 + historical mapped ones)
const VALID_ABBREVIATIONS = new Set([
  ...Object.keys(CURRENT_TEAMS),
  ...Object.keys(HISTORICAL_TO_CURRENT),
]);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log('='.repeat(60));
console.log('JourneyMan - Seed Data Cleanup');
console.log('='.repeat(60));

console.log('\nReading seed-data.json...');
const raw = readFileSync(DATA_PATH, 'utf-8');
const data = JSON.parse(raw);

console.log(`  ${data.players.length} players, ${data.teams.length} teams (before fix)`);

// Backup
copyFileSync(DATA_PATH, BACKUP_PATH);
console.log(`  Backup saved → seed-data.json.bak`);

// ---------------------------------------------------------------------------
// Fix Bug 1 + 2: clean up stints (remove TOT rows, remove defunct team rows)
// and filter players
// ---------------------------------------------------------------------------
console.log('\n[1/3] Cleaning stints (removing TOT + unrecognised team rows)...');

let playersRemoved = 0;
let totRowsRemoved = 0;
let defunctRowsRemoved = 0;

const cleanedPlayers = [];

for (const player of data.players) {
  // Step A: Remove TOT rows and rows from completely unrecognised teams
  const cleanedStints = [];
  for (const stint of player.stints) {
    const abbr = stint.teamAbbreviation;
    if (abbr === 'TOT') {
      totRowsRemoved++;
      continue; // skip aggregate rows
    }
    if (!VALID_ABBREVIATIONS.has(abbr)) {
      defunctRowsRemoved++;
      continue; // skip pre-merger teams with no modern identity
    }
    // Remap historical abbreviation to current team
    const canonical = HISTORICAL_TO_CURRENT[abbr] ?? abbr;
    cleanedStints.push({ ...stint, teamAbbreviation: canonical });
  }

  // Merge consecutive stints for the same team after remapping
  // (remapping can create consecutive dupes e.g. NOH + NOP both → NOP)
  const mergedStints = [];
  for (const stint of cleanedStints) {
    const prev = mergedStints[mergedStints.length - 1];
    if (prev && prev.teamAbbreviation === stint.teamAbbreviation) {
      // Merge: extend end year and sum games
      prev.endYear = Math.max(prev.endYear, stint.endYear);
      prev.gamesPlayed += stint.gamesPlayed;
    } else {
      mergedStints.push({ ...stint });
    }
  }

  // Re-number stintOrder (1-indexed)
  mergedStints.forEach((s, i) => { s.stintOrder = i + 1; });

  // Only keep players with >= 2 meaningful stints across recognised teams
  if (mergedStints.length < 2) {
    playersRemoved++;
    continue;
  }

  // Recalculate career years from cleaned stints
  const careerStartYear = mergedStints[0].startYear;
  const careerEndYear   = mergedStints[mergedStints.length - 1].endYear;

  cleanedPlayers.push({
    ...player,
    careerStartYear,
    careerEndYear,
    stints: mergedStints,
  });
}

console.log(`  TOT rows removed:          ${totRowsRemoved}`);
console.log(`  Defunct team rows removed: ${defunctRowsRemoved}`);
console.log(`  Players removed (<2 valid stints): ${playersRemoved}`);
console.log(`  Players remaining: ${cleanedPlayers.length}`);

// ---------------------------------------------------------------------------
// Fix Bug 3: NBA CDN image URLs using player name lookup
// Note: We don't have the NBA player IDs stored in the JSON (the Python
// script discarded them). We generate the CDN URL pattern as a TODO and
// leave imageUrl as null — same as before. The Python script fix below
// ensures future runs capture IDs. Existing imageUrl is already null.
// ---------------------------------------------------------------------------
console.log('\n[2/3] Image URLs — noting status...');
console.log('  imageUrl is null for all players (Wikipedia fetch failed).');
console.log('  NBA CDN URLs require NBA player IDs which were not stored.');
console.log('  → See fix-seed-data.js comments: re-run fetch-nba-data.py');
console.log('    after the Python fix to get CDN URLs, OR proceed without');
console.log('    images for now (puzzle game works fine without them).');

// ---------------------------------------------------------------------------
// Rebuild teams list: only the 30 current franchises
// ---------------------------------------------------------------------------
console.log('\n[3/3] Rebuilding teams list (30 current NBA franchises only)...');

const teamsOutput = Object.entries(CURRENT_TEAMS).map(([abbreviation, meta]) => ({
  abbreviation,
  name: meta.name,
  conference: meta.conference,
  division: meta.division,
}));

console.log(`  Teams: ${teamsOutput.length}`);

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const output = {
  teams: teamsOutput,
  players: cleanedPlayers,
};

writeFileSync(DATA_PATH, JSON.stringify(output, null, 2), 'utf-8');

console.log(`\n✅ Done!`);
console.log(`   Teams:   ${teamsOutput.length}  (was ${data.teams.length})`);
console.log(`   Players: ${cleanedPlayers.length}  (was ${data.players.length})`);
console.log(`\nNext step: node scripts/generate-puzzles.js`);
