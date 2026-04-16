import type { SQLiteDatabase } from "expo-sqlite";
import { runMigrations } from "./migrations";

export const DATABASE_NAME = "airsoft.db";

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await runMigrations(db);
}
