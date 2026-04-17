import type { SQLiteDatabase } from "expo-sqlite";
import { createId } from "@/utils/id";
import type { Match, MatchStatus, RoundResult } from "../types";

type MatchRow = {
  id: string;
  game_id: string;
  started_at: number;
  ended_at: number | null;
  status: string;
};

type RoundResultRow = {
  match_id: string;
  round_index: number;
  duration_ms: number;
  domination_json: string;
  neutral_ms: number;
  winner_team_id: string | null;
};

function rowToRound(row: RoundResultRow): RoundResult {
  return {
    index: row.round_index,
    durationMs: row.duration_ms,
    dominationMsByTeam: JSON.parse(row.domination_json) as Record<string, number>,
    neutralMs: row.neutral_ms,
    winnerTeamId: row.winner_team_id,
  };
}

async function getRoundsForMatch(db: SQLiteDatabase, matchId: string): Promise<RoundResult[]> {
  const rows = await db.getAllAsync<RoundResultRow>(
    "SELECT * FROM round_results WHERE match_id = ? ORDER BY round_index ASC",
    [matchId],
  );
  return rows.map(rowToRound);
}

async function rowToMatch(db: SQLiteDatabase, row: MatchRow): Promise<Match> {
  return {
    id: row.id,
    gameId: row.game_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    status: row.status as MatchStatus,
    rounds: await getRoundsForMatch(db, row.id),
  };
}

export async function startMatch(db: SQLiteDatabase, gameId: string): Promise<Match> {
  const match: Match = {
    id: createId(),
    gameId,
    startedAt: Date.now(),
    endedAt: null,
    status: "in_progress",
    rounds: [],
  };
  await db.runAsync(
    `INSERT INTO matches (id, game_id, started_at, ended_at, status) VALUES (?, ?, ?, ?, ?)`,
    [match.id, match.gameId, match.startedAt, match.endedAt, match.status],
  );
  return match;
}

export async function appendRound(
  db: SQLiteDatabase,
  matchId: string,
  round: RoundResult,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO round_results
       (match_id, round_index, duration_ms, domination_json, neutral_ms, winner_team_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      matchId,
      round.index,
      round.durationMs,
      JSON.stringify(round.dominationMsByTeam),
      round.neutralMs,
      round.winnerTeamId,
    ],
  );
}

export async function completeMatch(db: SQLiteDatabase, matchId: string): Promise<void> {
  await db.runAsync("UPDATE matches SET status = 'completed', ended_at = ? WHERE id = ?", [
    Date.now(),
    matchId,
  ]);
}

export async function abortMatch(db: SQLiteDatabase, matchId: string): Promise<void> {
  await db.runAsync("UPDATE matches SET status = 'aborted', ended_at = ? WHERE id = ?", [
    Date.now(),
    matchId,
  ]);
}

export async function getMatch(db: SQLiteDatabase, id: string): Promise<Match | null> {
  const row = await db.getFirstAsync<MatchRow>("SELECT * FROM matches WHERE id = ?", [id]);
  return row ? rowToMatch(db, row) : null;
}

export async function listMatchesForGame(db: SQLiteDatabase, gameId: string): Promise<Match[]> {
  const rows = await db.getAllAsync<MatchRow>(
    "SELECT * FROM matches WHERE game_id = ? ORDER BY started_at DESC",
    [gameId],
  );
  return Promise.all(rows.map((row) => rowToMatch(db, row)));
}

export async function listRecent(db: SQLiteDatabase, limit: number): Promise<Match[]> {
  const rows = await db.getAllAsync<MatchRow>(
    "SELECT * FROM matches WHERE status != 'in_progress' ORDER BY started_at DESC LIMIT ?",
    [limit],
  );
  return Promise.all(rows.map((row) => rowToMatch(db, row)));
}

export async function listAllCompleted(db: SQLiteDatabase): Promise<Match[]> {
  const rows = await db.getAllAsync<MatchRow>(
    "SELECT * FROM matches WHERE status != 'in_progress' ORDER BY started_at DESC",
  );
  return Promise.all(rows.map((row) => rowToMatch(db, row)));
}
