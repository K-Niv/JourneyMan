/**
 * client/src/data/teamLogos.js
 * =============================
 * Hardcoded NBA team logo URLs mapped by abbreviation.
 *
 * Uses the official NBA CDN for team primary logos.
 * These are stable, public URLs that don't require API keys.
 *
 * NBA CDN pattern: https://cdn.nba.com/logos/nba/{nbaTeamId}/primary/L/logo.svg
 * We use the ESPN CDN as a fallback-friendly alternative with abbreviation-based URLs.
 */

/**
 * Map of team abbreviation → logo image URL.
 * Uses the ESPN static CDN which serves PNG logos keyed by ESPN team ID.
 *
 * @type {Record<string, string>}
 */
export const TEAM_LOGOS = {
  ATL: 'https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg',
  BOS: 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg',
  BKN: 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg',
  CHA: 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg',
  CHI: 'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg',
  CLE: 'https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg',
  DAL: 'https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg',
  DEN: 'https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg',
  DET: 'https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg',
  GSW: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',
  HOU: 'https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg',
  IND: 'https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg',
  LAC: 'https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg',
  LAL: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
  MEM: 'https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg',
  MIA: 'https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg',
  MIL: 'https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg',
  MIN: 'https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg',
  NOP: 'https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg',
  NYK: 'https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg',
  OKC: 'https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg',
  ORL: 'https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg',
  PHI: 'https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg',
  PHX: 'https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg',
  POR: 'https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg',
  SAC: 'https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg',
  SAS: 'https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg',
  TOR: 'https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg',
  UTA: 'https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg',
  WAS: 'https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg',
};

/**
 * Get the logo URL for a team by abbreviation.
 * Returns null if the abbreviation is not found.
 *
 * @param {string} abbreviation - e.g. "LAL", "BOS"
 * @returns {string|null}
 */
export function getTeamLogo(abbreviation) {
  return TEAM_LOGOS[abbreviation] ?? null;
}
