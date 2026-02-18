import './loadEnv.js';
import { getDb } from './db/index.js';
import { encrypt, isEncrypted } from './services/encryptionService.js';
import { log } from './logger.js';

async function migrate() {
  const db = getDb();
  
  log.info('Starting data encryption migration...');

  // 1. Migrate Notes
  const notes = db.prepare('SELECT id, text FROM notes').all() as { id: number, text: string }[];
  for (const note of notes) {
    if (!isEncrypted(note.text)) {
      const encrypted = encrypt(note.text);
      db.prepare('UPDATE notes SET text = ? WHERE id = ?').run(encrypted, note.id);
      log.info(`Encrypted note ID: ${note.id}`);
    }
  }

  // 2. Migrate Important Dates
  const dates = db.prepare('SELECT id, title FROM important_dates').all() as { id: number, title: string }[];
  for (const date of dates) {
    if (!isEncrypted(date.title)) {
      const encrypted = encrypt(date.title);
      db.prepare('UPDATE important_dates SET title = ? WHERE id = ?').run(encrypted, date.id);
      log.info(`Encrypted date ID: ${date.id}`);
    }
  }

  log.info('Migration completed successfully!');
}

migrate().catch(err => {
  log.error('Migration failed:', err);
  process.exit(1);
});
