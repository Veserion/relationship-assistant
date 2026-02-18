import Database from 'better-sqlite3';

export function initSchema(db: InstanceType<typeof Database>): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('OWNER', 'PARTNER')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('wish', 'idea', 'preference', 'memory', 'gift', 'attention', 'date_idea', 'place', 'other')) DEFAULT 'wish',
      priority INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS important_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      reminder_type TEXT NOT NULL CHECK(reminder_type IN ('yearly', 'once')) DEFAULT 'yearly',
      remind_before_days INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      partner_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(owner_id),
      UNIQUE(partner_id),
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (partner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_type TEXT NOT NULL,
      reference_id INTEGER NOT NULL,
      sent_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);
    CREATE INDEX IF NOT EXISTS idx_dates_owner ON important_dates(owner_id);
    CREATE INDEX IF NOT EXISTS idx_dates_date ON important_dates(date);
    CREATE INDEX IF NOT EXISTS idx_logs_reference ON reminder_logs(reference_id, reminder_type);
    CREATE INDEX IF NOT EXISTS idx_pairs_owner ON pairs(owner_id);
    CREATE INDEX IF NOT EXISTS idx_pairs_partner ON pairs(partner_id);

    CREATE TABLE IF NOT EXISTS key_value (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
