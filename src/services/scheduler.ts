import cron from 'node-cron';
import { ReminderService } from './reminderService.js';
import { log } from '../logger.js';
import { Telegraf } from 'telegraf';
import type { BotContext } from '../types.js';
import { SCHEDULER_CONFIG } from '../schedulerConfig.js';
import { getAllPairs } from './userService.js';
import { logReminder } from './noteService.js';
import { getDb } from '../db/index.js';

export class SchedulerService {
  private reminderService: ReminderService;
  private timeZone = SCHEDULER_CONFIG.TIMEZONE;

  constructor(bot: Telegraf<BotContext>) {
    this.reminderService = new ReminderService(bot);
  }

  init() {
    log.info('Initializing Scheduler Service (Multi-Pair)...');

    // 1. Daily Compliment Scheduler
    cron.schedule(SCHEDULER_CONFIG.DAILY_COMPLIMENT_CRON, () => {
      const pairs = getAllPairs();
      pairs.forEach(pair => {
        this.scheduleRandomCompliment(pair.owner_id, pair.owner_tg);
      });
    }, { timezone: this.timeZone });

    // 2. Weekly Attention
    cron.schedule(SCHEDULER_CONFIG.WEEKLY_ATTENTION_CRON, () => {
      const pairs = getAllPairs();
      pairs.forEach(pair => {
        this.reminderService.sendWeeklyAttention(pair.owner_id, pair.owner_tg);
      });
    }, { timezone: this.timeZone });

    // 3. Bi-weekly Date
    cron.schedule(SCHEDULER_CONFIG.BIWEEKLY_DATE_CRON, async () => {
      const pairs = getAllPairs();
      const db = getDb();
      for (const pair of pairs) {
        const lastRun = db.prepare(`
          SELECT sent_at FROM reminder_logs 
          WHERE reminder_type = 'biweekly_date' AND reference_id = ? 
          ORDER BY sent_at DESC LIMIT 1
        `).get(pair.owner_id) as { sent_at: string } | undefined;

        let shouldRun = true;
        if (lastRun) {
          const diffDays = (new Date().getTime() - new Date(lastRun.sent_at).getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays < SCHEDULER_CONFIG.BIWEEKLY_MIN_INTERVAL_DAYS) shouldRun = false;
        }
        
        if (shouldRun) {
          await this.reminderService.sendBiWeeklyDate(pair.owner_id, pair.owner_tg);
          logReminder('biweekly_date', pair.owner_id);
        }
      }
    }, { timezone: this.timeZone });

    // 4. Monthly Gift
    cron.schedule(SCHEDULER_CONFIG.MONTHLY_GIFT_CRON, () => {
      const pairs = getAllPairs();
      pairs.forEach(async (pair) => {
        await this.reminderService.sendMonthlyGift(pair.owner_id, pair.owner_tg);
        logReminder('monthly_gift', pair.owner_id);
      });
    }, { timezone: this.timeZone });

    // 5. Important Dates Check
    cron.schedule('0 9 * * *', () => { // Every day at 9 AM
      const pairs = getAllPairs();
      pairs.forEach(pair => {
        this.reminderService.checkImportantDates(pair.owner_id, pair.owner_tg);
      });
    }, { timezone: this.timeZone });

    // Startup check
    const startupPairs = getAllPairs();
    startupPairs.forEach(pair => this.scheduleRandomCompliment(pair.owner_id, pair.owner_tg));

    log.info('Scheduler initialized.');
  }

  private scheduleRandomCompliment(ownerId: number, targetTgId: number) {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    
    const lastSentRow = db.prepare(`
        SELECT sent_at FROM reminder_logs 
        WHERE reminder_type = 'daily_compliment' AND reference_id = ? 
        AND date(sent_at) = date(?)
        LIMIT 1
    `).get(ownerId, today) as any;

    if (lastSentRow) {
      log.info(`Daily compliment already sent today for ${targetTgId}.`);
      return;
    }

    const currentHourUtc = new Date().getUTCHours();
    const endHourUtc = SCHEDULER_CONFIG.DAILY_WINDOW_END_UTC;
    if (currentHourUtc >= endHourUtc) return;

    // Schedule within 0-10 minutes for now to ensure it works
    const randomDelay = Math.floor(Math.random() * 10 * 60 * 1000);
    
    setTimeout(async () => {
      await this.reminderService.sendDailyCompliment(ownerId, targetTgId);
      logReminder('daily_compliment', ownerId);
    }, randomDelay);
  }
}
