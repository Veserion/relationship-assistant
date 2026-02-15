import { getDb } from '../db/index.js';
import { resolveRole } from '../config.js';
import type { User } from '../types.js';

export function ensureUser(telegramId: number, role: string): number {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegramId) as { id: number } | undefined;
  if (existing) return existing.id;
  db.prepare('INSERT INTO users (telegram_id, role) VALUES (?, ?)').run(telegramId, role);
  return db.prepare('SELECT last_insert_rowid()').pluck().get() as number;
}

export function getUserByTelegramId(telegramId: number): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId) as User | undefined;
}

/** Создаёт или обновляет пользователя с выбранной ролью */
export function createUserWithRole(telegramId: number, role: 'OWNER' | 'PARTNER'): User {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(telegramId) as { id: number } | undefined;
  if (existing) {
    db.prepare('UPDATE users SET role = ? WHERE telegram_id = ?').run(role, telegramId);
  } else {
    db.prepare('INSERT INTO users (telegram_id, role) VALUES (?, ?)').run(telegramId, role);
  }
  return getUserByTelegramId(telegramId)!;
}

/** Только для OWNER — создаёт/возвращает владельца */
export function getOrCreateOwner(telegramId: number): User | null {
  if (resolveRole(telegramId) !== 'OWNER') return null;
  ensureUser(telegramId, 'OWNER');
  return getUserByTelegramId(telegramId) ?? null;
}

export function getOrCreateUser(telegramId: number): User | null {
  const role = resolveRole(telegramId);
  if (!role) return null;
  ensureUser(telegramId, role);
  return getUserByTelegramId(telegramId) ?? null;
}
