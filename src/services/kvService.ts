import { getDb } from '../db/index.js';

export const KV = {
  get: (key: string): string | undefined => {
    const db = getDb();
    const row = db.prepare('SELECT value FROM key_value WHERE key = ?').get(key) as { value: string } | undefined;
    return row?.value;
  },

  set: (key: string, value: string): void => {
    const db = getDb();
    db.prepare(`
      INSERT INTO key_value (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `).run(key, value);
  },

  delete: (key: string): void => {
    const db = getDb();
    db.prepare('DELETE FROM key_value WHERE key = ?').run(key);
  }
};
