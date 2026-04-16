import type { SQLiteDatabase } from "expo-sqlite";

export async function get(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    [key],
  );
  return row?.value ?? null;
}

export async function set(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function getAll(db: SQLiteDatabase): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM app_settings",
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
