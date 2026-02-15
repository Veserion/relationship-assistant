import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { initSchema } from './schema.js';
import { config } from '../config.js';

type DbInstance = InstanceType<typeof Database>;
let db: DbInstance | null = null;

export function getDb(): DbInstance {
  if (!db) {
    const dir = dirname(config.dbConnection);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    db = new Database(config.dbConnection);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
