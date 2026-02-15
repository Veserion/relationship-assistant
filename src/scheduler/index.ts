import cron from 'node-cron';
import { getDb } from '../db/index.js';
import { getDatesDueForReminderToday } from '../services/dateService.js';
import {
  getRandomNoteExcludingRecent,
  getRecentReminderNoteIds,
  logReminder,
} from '../services/noteService.js';

let botInstance: { telegram: { sendMessage: (chatId: number, text: string) => Promise<unknown> } } | null = null;

export function initScheduler(bot: { telegram: { sendMessage: (chatId: number, text: string) => Promise<unknown> } }): void {
  botInstance = bot;

  cron.schedule('0 9 * * *', runDateReminders, {
    timezone: 'Europe/Moscow',
  });

  cron.schedule('0 12 * * *', runRandomReminder, {
    timezone: 'Europe/Moscow',
  });

  console.log('[Scheduler] Cron jobs registered: date reminders 09:00, random 12:00');
}

async function runDateReminders(): Promise<void> {
  if (!botInstance) return;
  try {
    const db = getDb();
    const owners = db.prepare(
      "SELECT id, telegram_id FROM users WHERE role = 'OWNER'"
    ).all() as { id: number; telegram_id: number }[];

    for (const owner of owners) {
      const due = getDatesDueForReminderToday(owner.id);
      for (const d of due) {
        const daysText =
          d.remind_before_days > 0 ? `за ${d.remind_before_days} дн.` : 'сегодня';
        await botInstance.telegram.sendMessage(
          owner.telegram_id,
          `💝 ${d.title}\n${d.date} — ${daysText} ${d.remind_before_days > 0 ? 'до события' : 'день события!'}`
        );
        logReminder('date', d.id);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Date reminder error:', err);
  }
}

async function runRandomReminder(): Promise<void> {
  if (!botInstance) return;
  try {
    const db = getDb();
    const owners = db.prepare(
      "SELECT id, telegram_id FROM users WHERE role = 'OWNER'"
    ).all() as { id: number; telegram_id: number }[];
    if (!owners.length) return;

    const excludeIds = getRecentReminderNoteIds(7);
    const notes = getRandomNoteExcludingRecent(excludeIds, 1);
    if (!notes.length) return;

    const note = notes[0];
    for (const owner of owners) {
        await botInstance.telegram.sendMessage(
          owner.telegram_id,
          `💌 Твоя половинка написала: «${note.text}»`
        );
    }
    logReminder('random_note', note.id);
  } catch (err) {
    console.error('[Scheduler] Random reminder error:', err);
  }
}
