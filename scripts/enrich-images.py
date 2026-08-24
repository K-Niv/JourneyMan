#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
enrich-images.py
================
Adds NBA CDN headshot URLs to prisma/data/seed-data.json using the
nba_api static player list (local, no API calls — runs in seconds).

NBA CDN URL pattern:
  https://cdn.nba.com/headshots/nba/latest/260x190/{player_id}.png

Matching strategy:
  1. Exact full-name match (firstName + lastName)
  2. Case-insensitive full-name match
  3. No match → imageUrl stays null

Usage:
  python scripts/enrich-images.py

Output: overwrites prisma/data/seed-data.json in place.
"""
import json
import os
import sys

try:
    from nba_api.stats.static import players as nba_players_static
except ImportError:
    print("ERROR: nba_api not installed. Run: pip install nba_api")
    sys.exit(1)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "..", "prisma", "data", "seed-data.json")
CDN_BASE = "https://cdn.nba.com/headshots/nba/latest/260x190/{player_id}.png"

print("=" * 60)
print("JourneyMan - Image URL Enrichment")
print("=" * 60)

# ---------------------------------------------------------------------------
# Build name → id lookup from nba_api static list
# ---------------------------------------------------------------------------
print("\nLoading nba_api static player list...")
static_players = nba_players_static.get_players()
print(f"  {len(static_players)} players in static list")

# Build two lookup dicts: exact and lowercase
name_to_id = {}           # "LeBron James" -> 2544
name_lower_to_id = {}     # "lebron james" -> 2544

for p in static_players:
    full = f"{p['first_name']} {p['last_name']}"
    name_to_id[full] = p['id']
    name_lower_to_id[full.lower()] = p['id']

# ---------------------------------------------------------------------------
# Load seed-data.json
# ---------------------------------------------------------------------------
print("\nReading seed-data.json...")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

players = data["players"]
print(f"  {len(players)} players to enrich")

# ---------------------------------------------------------------------------
# Match and assign CDN URLs
# ---------------------------------------------------------------------------
matched = 0
unmatched = 0
unmatched_names = []

for player in players:
    full_name = f"{player['firstName']} {player['lastName']}"

    # Strategy 1: exact match
    pid = name_to_id.get(full_name)

    # Strategy 2: case-insensitive
    if pid is None:
        pid = name_lower_to_id.get(full_name.lower())

    if pid is not None:
        player["imageUrl"] = CDN_BASE.format(player_id=pid)
        matched += 1
    else:
        player["imageUrl"] = None
        unmatched += 1
        unmatched_names.append(full_name)

print(f"\n  Matched:   {matched}/{len(players)}")
print(f"  Unmatched: {unmatched}/{len(players)}")

if unmatched_names:
    print(f"\n  First 20 unmatched players:")
    for name in unmatched_names[:20]:
        print(f"    - {name}")
    if len(unmatched_names) > 20:
        print(f"    ... and {len(unmatched_names) - 20} more")

# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------
with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

pct = round(matched / len(players) * 100, 1)
print(f"\n✅ Done! {matched}/{len(players)} players have CDN image URLs ({pct}%).")
print(f"   Output: {DATA_PATH}")
print("\nNext step: node scripts/generate-puzzles.js")
