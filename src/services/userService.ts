import { getDb } from '../db/index.js';
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
  const existing = getUserByTelegramId(telegramId);
  if (existing) {
    db.prepare('UPDATE users SET role = ? WHERE telegram_id = ?').run(role, telegramId);
  } else {
    db.prepare('INSERT INTO users (telegram_id, role) VALUES (?, ?)').run(telegramId, role);
  }
  return getUserByTelegramId(telegramId)!;
}

export function linkPair(ownerTelegramId: number, partnerTelegramId: number): void {
  const db = getDb();
  const owner = getUserByTelegramId(ownerTelegramId);
  const partner = getUserByTelegramId(partnerTelegramId);
  
  if (!owner || !partner) throw new Error('Users not found');
  
  db.prepare(`
    INSERT OR REPLACE INTO pairs (owner_id, partner_id) 
    VALUES (?, ?)
  `).run(owner.id, partner.id);
}

export function getPartner(userId: number): User | undefined {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
  if (!user) return undefined;

  const pair = db.prepare(`
    SELECT * FROM pairs WHERE owner_id = ? OR partner_id = ?
  `).get(user.id, user.id) as { owner_id: number, partner_id: number } | undefined;

  if (!pair) return undefined;

  const partnerId = pair.owner_id === user.id ? pair.partner_id : pair.owner_id;
  if (!partnerId) return undefined;

  return db.prepare('SELECT * FROM users WHERE id = ?').get(partnerId) as User | undefined;
}

export function getPairContext(userId: number): { owner: User, partner?: User } | undefined {
  const db = getDb();
  const pair = db.prepare(`
    SELECT * FROM pairs WHERE owner_id = ? OR partner_id = ?
  `).get(userId, userId) as { owner_id: number, partner_id: number } | undefined;

  if (!pair) return undefined;

  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(pair.owner_id) as User;
  const partner = pair.partner_id ? db.prepare('SELECT * FROM users WHERE id = ?').get(pair.partner_id) as User : undefined;

  return { owner, partner };
}
export function getAllPairs(): { owner_id: number, partner_id: number, owner_tg: number, partner_tg: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT p.owner_id, p.partner_id, uo.telegram_id as owner_tg, up.telegram_id as partner_tg
    FROM pairs p
    JOIN users uo ON p.owner_id = uo.id
    LEFT JOIN users up ON p.partner_id = up.id
  `).all() as any[];
}
