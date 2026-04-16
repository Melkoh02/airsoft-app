import type { SQLiteDatabase } from "expo-sqlite";

type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          teams_json TEXT NOT NULL,
          round_duration_ms INTEGER NOT NULL,
          round_count INTEGER NOT NULL,
          countdown_duration_ms INTEGER NOT NULL,
          button_source TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY NOT NULL,
          game_id TEXT NOT NULL,
          started_at INTEGER NOT NULL,
          ended_at INTEGER,
          status TEXT NOT NULL,
          FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS round_results (
          match_id TEXT NOT NULL,
          round_index INTEGER NOT NULL,
          duration_ms INTEGER NOT NULL,
          domination_json TEXT NOT NULL,
          neutral_ms INTEGER NOT NULL,
          winner_team_id TEXT,
          PRIMARY KEY (match_id, round_index),
          FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_matches_game_id ON matches(game_id);
        CREATE INDEX IF NOT EXISTS idx_round_results_match_id ON round_results(match_id);
      `);
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const current = result?.user_version ?? 0;
  const pending = migrations.filter((m) => m.version > current);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
