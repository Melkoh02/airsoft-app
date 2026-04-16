import type { SQLiteDatabase } from "expo-sqlite";
import { createId } from "@/utils/id";
import type { ButtonSource, Game, GameInput, Team } from "../types";

type GameRow = {
  id: string;
  name: string;
  teams_json: string;
  round_duration_ms: number;
  round_count: number;
  countdown_duration_ms: number;
  button_source: string;
  created_at: number;
  updated_at: number;
};

function rowToGame(row: GameRow): Game {
  return {
    id: row.id,
    name: row.name,
    teams: JSON.parse(row.teams_json) as [Team, Team],
    roundDurationMs: row.round_duration_ms,
    roundCount: row.round_count,
    countdownDurationMs: row.countdown_duration_ms,
    buttonSource: row.button_source as ButtonSource,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createGame(db: SQLiteDatabase, input: GameInput): Promise<Game> {
  const now = Date.now();
  const game: Game = { id: createId(), createdAt: now, updatedAt: now, ...input };
  await db.runAsync(
    `INSERT INTO games
       (id, name, teams_json, round_duration_ms, round_count, countdown_duration_ms, button_source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      game.id,
      game.name,
      JSON.stringify(game.teams),
      game.roundDurationMs,
      game.roundCount,
      game.countdownDurationMs,
      game.buttonSource,
      game.createdAt,
      game.updatedAt,
    ],
  );
  return game;
}

export async function updateGame(db: SQLiteDatabase, id: string, input: GameInput): Promise<Game> {
  const now = Date.now();
  await db.runAsync(
    `UPDATE games
       SET name = ?, teams_json = ?, round_duration_ms = ?, round_count = ?,
           countdown_duration_ms = ?, button_source = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.name,
      JSON.stringify(input.teams),
      input.roundDurationMs,
      input.roundCount,
      input.countdownDurationMs,
      input.buttonSource,
      now,
      id,
    ],
  );
  const updated = await getGame(db, id);
  if (!updated) throw new Error(`Game not found: ${id}`);
  return updated;
}

export async function deleteGame(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM games WHERE id = ?", [id]);
}

export async function getGame(db: SQLiteDatabase, id: string): Promise<Game | null> {
  const row = await db.getFirstAsync<GameRow>("SELECT * FROM games WHERE id = ?", [id]);
  return row ? rowToGame(row) : null;
}

export async function listGames(db: SQLiteDatabase): Promise<Game[]> {
  const rows = await db.getAllAsync<GameRow>("SELECT * FROM games ORDER BY updated_at DESC");
  return rows.map(rowToGame);
}
