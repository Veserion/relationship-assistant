import { getDb } from '../db/index.js';
import type { ImportantDate } from '../types.js';
import { encrypt, decrypt } from './encryptionService.js';

export function addImportantDate(
  ownerId: number,
  title: string,
  date: string,
  reminderType: 'yearly' | 'once' = 'yearly',
  remindBeforeDays: number = 0
): number {
  const db = getDb();
  const encryptedTitle = encrypt(title);
  const result = db.prepare(
    `INSERT INTO important_dates (owner_id, title, date, reminder_type, remind_before_days)
     VALUES (?, ?, ?, ?, ?)`
  ).run(ownerId, encryptedTitle, date, reminderType, remindBeforeDays);
  return result.lastInsertRowid as number;
}

export function getDatesByOwner(ownerId: number): ImportantDate[] {
  const db = getDb();
  const dates = db.prepare(
    'SELECT * FROM important_dates WHERE owner_id = ? ORDER BY date ASC'
  ).all(ownerId) as ImportantDate[];

  return dates.map(d => ({ ...d, title: decrypt(d.title) }));
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return formatDate(d);
}

function isDateDue(targetDate: string, remindBeforeDays: number, todayStr: string): boolean {
  const reminderDate = addDays(targetDate, remindBeforeDays);
  return todayStr === reminderDate || todayStr === targetDate;
}

function isDateDueYearly(
  targetMMDD: string,
  remindBeforeDays: number,
  today: Date,
  todayMMDD: string
): boolean {
  if (todayMMDD === targetMMDD) return true;
  const targetDate = new Date(today.getFullYear() + '-' + targetMMDD + 'T12:00:00Z');
  const reminderDate = new Date(targetDate);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - remindBeforeDays);
  const reminderMMDD = formatDate(reminderDate).slice(5);
  return todayMMDD === reminderMMDD;
}

export function getDatesDueForReminderToday(ownerId: number): ImportantDate[] {
  const db = getDb();
  const today = new Date();
  const todayStr = formatDate(today);
  const todayMMDD = todayStr.slice(5);

  const all = db.prepare('SELECT * FROM important_dates WHERE owner_id = ?').all(ownerId) as ImportantDate[];
  const due: ImportantDate[] = [];
  for (const d of all) {
    const decryptedTitle = decrypt(d.title);
    const dateCopy = { ...d, title: decryptedTitle };
    
    if (d.reminder_type === 'once') {
      const target = d.date.slice(0, 10);
      if (isDateDue(target, d.remind_before_days, todayStr)) due.push(dateCopy);
    } else {
      const targetMMDD = d.date.slice(5, 10);
      if (isDateDueYearly(targetMMDD, d.remind_before_days, today, todayMMDD)) due.push(dateCopy);
    }
  }
  return due;
}

export function deleteDate(id: number, ownerId: number): { changes: number } {
  const db = getDb();
  return db.prepare('DELETE FROM important_dates WHERE id = ? AND owner_id = ?').run(id, ownerId);
}
