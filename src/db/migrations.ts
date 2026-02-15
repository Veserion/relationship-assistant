import { getDb } from './index.js';
import { log } from '../logger.js';

export function migrateCategories(): void {
  const db = getDb();
  
  // Check if we need migration (check if check constraint contains new categories)
  // Since we can't easily parse CHECK constraint from SQL in SQLite, we will rely on a flag or just try to insert a new category and see if it fails.
  // Actually, safer and more robust way for this project: Recreate the table with new definition.
  
  log.info('Starting migration: updating notes categories...');

  db.transaction(() => {
    // 1. Rename old table
    db.prepare('ALTER TABLE notes RENAME TO notes_old').run();

    // 2. Create new table with updated CHECK constraint
    db.prepare(`
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('wish', 'idea', 'preference', 'memory', 'gift', 'attention', 'date_idea', 'place', 'other')) DEFAULT 'wish',
        priority INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // 3. Copy data
    db.prepare(`
      INSERT INTO notes (id, user_id, text, category, priority, created_at)
      SELECT id, user_id, text, category, priority, created_at FROM notes_old
    `).run();

    // 4. Drop old table
    db.prepare('DROP TABLE notes_old').run();
    
    // 5. Recreate indexes
    db.prepare('CREATE INDEX idx_notes_user ON notes(user_id)').run();
    db.prepare('CREATE INDEX idx_notes_created ON notes(created_at)').run();

  })();

  log.info('Migration complete: notes table updated.');
}
