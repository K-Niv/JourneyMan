#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch-nba-data.py
=================
Fetches NBA player career stints from nba_api.
Outputs: prisma/data/seed-data.json

Usage:
    pip install nba_api tqdm
    python scripts/fetch-nba-data.py

Runtime: ~30-60 minutes due to NBA.com rate limits.
The output JSON is committed to the repo so there is no need to re-run this.

Note: imageUrl is left null by this script.
      Run scripts/enrich-images.py afterwards to populate NBA CDN headshot URLs.
"""
import sys
import io

# Force UTF-8 output on Windows to avoid cp1252 UnicodeEncodeError
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import json
import time
import os
from collections import defaultdict

try:
    from nba_api.stats.endpoints import commonallplayers, playercareerstats
    from nba_api.stats.static import teams as nba_teams_static
except ImportError:
    print("ERROR: nba_api not installed. Run: pip install nba_api requests tqdm")
    raise

try:
    from tqdm import tqdm
except ImportError:
    # Fallback if tqdm not installed
    def tqdm(iterable, **kwargs):
        return iterable

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MIN_GAMES_PER_STINT = 1
MIN_STINTS = 2
REQUEST_DELAY = 0.7  # seconds between nba_api calls
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "prisma", "data", "seed-data.json")

# NBA team abbreviation → full name + conference/division
# Using nba_api static data as ground truth
TEAM_META = {}
for t in nba_teams_static.get_teams():
    TEAM_META[t["abbreviation"]] = {
        "name": t["full_name"],
        "abbreviation": t["abbreviation"],
        "conference": None,  # nba_api static doesn't include this; we add manually below
        "division": None,
    }

# Manual conference/division mapping for the 30 current NBA franchises
CONFERENCE_DIVISION = {
    "ATL": ("Eastern", "Southeast"), "BOS": ("Eastern", "Atlantic"),
    "BKN": ("Eastern", "Atlantic"),  "CHA": ("Eastern", "Southeast"),
    "CHI": ("Eastern", "Central"),   "CLE": ("Eastern", "Central"),
    "DAL": ("Western", "Southwest"), "DEN": ("Western", "Northwest"),
    "DET": ("Eastern", "Central"),   "GSW": ("Western", "Pacific"),
    "HOU": ("Western", "Southwest"), "IND": ("Eastern", "Central"),
    "LAC": ("Western", "Pacific"),   "LAL": ("Western", "Pacific"),
    "MEM": ("Western", "Southwest"), "MIA": ("Eastern", "Southeast"),
    "MIL": ("Eastern", "Central"),   "MIN": ("Western", "Northwest"),
    "NOP": ("Western", "Southwest"), "NYK": ("Eastern", "Atlantic"),
    "OKC": ("Western", "Northwest"), "ORL": ("Eastern", "Southeast"),
    "PHI": ("Eastern", "Atlantic"),  "PHX": ("Western", "Pacific"),
    "POR": ("Western", "Northwest"), "SAC": ("Western", "Pacific"),
    "SAS": ("Western", "Southwest"), "TOR": ("Eastern", "Atlantic"),
    "UTA": ("Western", "Northwest"), "WAS": ("Eastern", "Southeast"),
}

for abbr, (conf, div) in CONFERENCE_DIVISION.items():
    if abbr in TEAM_META:
        TEAM_META[abbr]["conference"] = conf
        TEAM_META[abbr]["division"] = div



def calculate_stints(career_rows: list[dict]) -> list[dict]:
    """
    Given season-by-season career rows from PlayerCareerStats,
    collapse consecutive seasons with the same team into a single stint.
    Returns list of stint dicts sorted by stintOrder.
    """
    if not career_rows:
        return []

    stints = []
    current_team = None
    current_start = None
    current_end = None
    current_games = 0

    for row in career_rows:
        team_abbr = (row.get("TEAM_ABBREVIATION") or "").strip()
        season_str = (row.get("SEASON_ID") or "")  # e.g. "2003-04"
        games = int(row.get("GP") or 0)

        if not team_abbr or not season_str:
            continue

        # Parse start year from season string "YYYY-YY"
        try:
            season_start = int(season_str[:4])
        except ValueError:
            continue

        if games < MIN_GAMES_PER_STINT:
            continue

        if team_abbr != current_team:
            # Save the completed stint
            if current_team is not None and current_games >= MIN_GAMES_PER_STINT:
                stints.append({
                    "teamAbbreviation": current_team,
                    "startYear": current_start,
                    "endYear": current_end + 1,  # endYear = season that ended
                    "gamesPlayed": current_games,
                })
            current_team = team_abbr
            current_start = season_start
            current_end = season_start
            current_games = games
        else:
            current_end = season_start
            current_games += games

    # Flush last stint
    if current_team is not None and current_games >= MIN_GAMES_PER_STINT:
        stints.append({
            "teamAbbreviation": current_team,
            "startYear": current_start,
            "endYear": current_end + 1,
            "gamesPlayed": current_games,
        })

    # Add stintOrder (1-indexed)
    for i, stint in enumerate(stints):
        stint["stintOrder"] = i + 1

    return stints


def main():
    print('=' * 60)
    print('JourneyMan - NBA Data Fetcher')
    print('=' * 60)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    # Step 1: Get all historical NBA players
    print("\n[1/3] Fetching all NBA players from commonallplayers...")
    all_players_data = commonallplayers.CommonAllPlayers(
        is_only_current_season=0,
        league_id="00",
        season="2024-25",
    )
    all_players = all_players_data.get_data_frames()[0]
    print(f"      Found {len(all_players)} total players.")
    time.sleep(REQUEST_DELAY)

    # Step 2: For each player, fetch career stats and calculate stints
    print("\n[2/3] Fetching career stats per player (this takes ~30-60 min)...")

    eligible_players = []
    seen_teams = set()

    player_list = all_players.to_dict("records")

    for player_row in tqdm(player_list, desc="Processing players"):
        player_id = player_row.get("PERSON_ID")
        first_name = (player_row.get("DISPLAY_FIRST_LAST", "") or "").split(" ")[0].strip()
        last_name = " ".join((player_row.get("DISPLAY_FIRST_LAST", "") or "").split(" ")[1:]).strip()

        if not first_name or not last_name:
            continue

        try:
            career = playercareerstats.PlayerCareerStats(
                player_id=player_id,
                per_mode36="Totals",
            )
            career_df = career.get_data_frames()[0]  # SeasonTotalsRegularSeason
            career_rows = career_df.to_dict("records")
            time.sleep(REQUEST_DELAY)
        except Exception:
            time.sleep(REQUEST_DELAY * 2)
            continue

        stints = calculate_stints(career_rows)

        if len(stints) < MIN_STINTS:
            continue

        # Track which teams appear so we build the teams list
        for stint in stints:
            seen_teams.add(stint["teamAbbreviation"])

        # Determine career years
        career_start = stints[0]["startYear"] if stints else None
        career_end = stints[-1]["endYear"] if stints else None

        eligible_players.append({
            "firstName": first_name,
            "lastName": last_name,
            "imageUrl": None,  # populated by scripts/enrich-images.py
            "careerStartYear": career_start,
            "careerEndYear": career_end,
            "stints": stints,
        })

    print(f"\n      Found {len(eligible_players)} eligible players (>={MIN_STINTS} stints).")

    # Step 3: Build teams list (only teams that appear in stints)
    print("\n[3/3] Building teams list...")
    teams_output = []
    for abbr in sorted(seen_teams):
        if abbr in TEAM_META:
            teams_output.append(TEAM_META[abbr])
        else:
            # Historical/relocated franchise not in current static list
            teams_output.append({
                "name": abbr,  # fallback: use abbreviation as name
                "abbreviation": abbr,
                "conference": None,
                "division": None,
            })

    # Step 5: Write output
    output = {
        "teams": teams_output,
        "players": eligible_players,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Wrote {len(eligible_players)} players and {len(teams_output)} teams.")
    print(f"   Output: {OUTPUT_PATH}")
    print("\nNext steps:")
    print("  1. python scripts/enrich-images.py   (adds NBA CDN headshot URLs)")
    print("  2. node scripts/generate-puzzles.js  (generates puzzle schedule)")


if __name__ == "__main__":
    main()
