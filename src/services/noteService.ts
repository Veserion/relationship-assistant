import { getDb } from '../db/index.js';
import type { Note } from '../types.js';

export const CATEGORY_NAMES: Record<string, string> = {
  gift: '🎁 Подарки',
  attention: '🥰 Знаки внимания',
  date_idea: '💡 Идеи для свиданий',
  place: '📍 Места',
  wish: '✨ Другое/Желания',
  idea: '💡 Идеи',
  preference: '❤️ Предпочтения',
  memory: '📸 Воспоминания',
  other: '✨ Другое'
};

export const CATEGORIES = [
  'wish',
  'idea',
  'preference',
  'memory',
  'gift',
  'attention',
  'date_idea',
  'place',
  'other',
] as const;
export type NoteCategory = (typeof CATEGORIES)[number];

export function addNote(
  userId: number,
  text: string,
  category: string = 'wish',
  priority: number = 0
): number {
  const c = CATEGORIES.includes(category as NoteCategory) ? category : 'wish';
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO notes (user_id, text, category, priority) VALUES (?, ?, ?, ?)'
  ).run(userId, text, c, priority);
  return result.lastInsertRowid as number;
}

export function getNotesByUser(userId: number, limit: number = 50): Note[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, limit) as Note[];
}

export function getNotesForOwner(ownerUserId: number, limit: number = 50): (Note & { telegram_id?: number })[] {
  const db = getDb();
  return db.prepare(`
    SELECT n.*, u.telegram_id
    FROM notes n
    JOIN users u ON n.user_id = u.id
    JOIN pairs p ON (p.owner_id = ? AND p.partner_id = u.id)
    ORDER BY n.created_at DESC
    LIMIT ?
  `).all(ownerUserId, limit) as (Note & { telegram_id?: number })[];
}

export function getRandomNoteExcludingRecent(excludeLastIds: number[] = [], limit: number = 5): Note[] {
  const db = getDb();
  const placeholders = excludeLastIds.length
    ? 'AND n.id NOT IN (' + excludeLastIds.map(() => '?').join(',') + ')'
    : '';
  const params = [...excludeLastIds, limit];
  return db.prepare(`
    SELECT n.* FROM notes n
    WHERE 1=1 ${placeholders}
    ORDER BY RANDOM()
    LIMIT ?
  `).all(...params) as Note[];
}

export function getRecentReminderNoteIds(days: number = 7): number[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT reference_id FROM reminder_logs
    WHERE reminder_type = 'random_note'
    AND sent_at > datetime('now', ?)
  `).all(`-${days} days`) as { reference_id: number }[];
  return rows.map((r) => r.reference_id).filter(Boolean);
}

export function logReminder(reminderType: string, referenceId: number): void {
  const db = getDb();
  db.prepare('INSERT INTO reminder_logs (reminder_type, reference_id) VALUES (?, ?)')
    .run(reminderType, referenceId);
}

export function getNoteById(id: number): Note | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
}

export function updateNote(id: number, text: string): void {
  const db = getDb();
  db.prepare('UPDATE notes SET text = ? WHERE id = ?').run(text, id);
}

export function deleteNote(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
}
