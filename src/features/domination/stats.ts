import type { Game, Match, RoundResult } from "./types";

export type GlobalStats = {
  matchesPlayed: number;
  roundsPlayed: number;
  totalActiveMs: number;
};

function roundActiveMs(round: RoundResult): number {
  let sum = round.neutralMs;
  for (const key of Object.keys(round.dominationMsByTeam)) {
    sum += round.dominationMsByTeam[key];
  }
  return sum;
}

export function computeGlobalStats(matches: Match[]): GlobalStats {
  let matchesPlayed = 0;
  let roundsPlayed = 0;
  let totalActiveMs = 0;
  for (const match of matches) {
    if (match.status === "completed") matchesPlayed++;
    for (const round of match.rounds) {
      roundsPlayed++;
      totalActiveMs += roundActiveMs(round);
    }
  }
  return { matchesPlayed, roundsPlayed, totalActiveMs };
}

export type MatchStats = {
  winnerTeamId: string | null;
  roundsWonByTeam: Record<string, number>;
  totalDominationMsByTeam: Record<string, number>;
  totalNeutralMs: number;
  completedRounds: number;
};

export function computeMatchStats(match: Match, game: Game): MatchStats {
  const [teamA, teamB] = game.teams;
  const roundsWon: Record<string, number> = { [teamA.id]: 0, [teamB.id]: 0 };
  const totals: Record<string, number> = { [teamA.id]: 0, [teamB.id]: 0 };
  let totalNeutralMs = 0;

  for (const round of match.rounds) {
    if (round.winnerTeamId && round.winnerTeamId in roundsWon) {
      roundsWon[round.winnerTeamId] += 1;
    }
    totals[teamA.id] += round.dominationMsByTeam[teamA.id] ?? 0;
    totals[teamB.id] += round.dominationMsByTeam[teamB.id] ?? 0;
    totalNeutralMs += round.neutralMs;
  }

  let winner: string | null = null;
  if (roundsWon[teamA.id] > roundsWon[teamB.id]) winner = teamA.id;
  else if (roundsWon[teamB.id] > roundsWon[teamA.id]) winner = teamB.id;
  else if (totals[teamA.id] > totals[teamB.id]) winner = teamA.id;
  else if (totals[teamB.id] > totals[teamA.id]) winner = teamB.id;

  return {
    winnerTeamId: winner,
    roundsWonByTeam: roundsWon,
    totalDominationMsByTeam: totals,
    totalNeutralMs,
    completedRounds: match.rounds.length,
  };
}
