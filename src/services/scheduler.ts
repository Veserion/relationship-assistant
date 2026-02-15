import cron from 'node-cron';
import { ReminderService } from './reminderService.js';
import { KV } from './kvService.js';
import { log } from '../logger.js';
import { Telegraf } from 'telegraf';
import type { BotContext } from '../types.js';
import { SCHEDULER_CONFIG } from '../schedulerConfig.js';

export class SchedulerService {
  private reminderService: ReminderService;
  private timeZone = SCHEDULER_CONFIG.TIMEZONE;

  constructor(bot: Telegraf<BotContext>) {
    this.reminderService = new ReminderService(bot);
  }

  init() {
    log.info('Initializing Scheduler Service...');

    // 1. Daily Compliment Scheduler
    cron.schedule(SCHEDULER_CONFIG.DAILY_COMPLIMENT_CRON, () => {
        this.scheduleRandomCompliment();
    }, { timezone: this.timeZone });

    // Also run on startup to check if we missed it today
    this.scheduleRandomCompliment();


    // 2. Weekly Attention
    cron.schedule(SCHEDULER_CONFIG.WEEKLY_ATTENTION_CRON, () => {
        this.reminderService.sendWeeklyAttention();
    }, { timezone: this.timeZone });


    // 3. Bi-weekly Date
    cron.schedule(SCHEDULER_CONFIG.BIWEEKLY_DATE_CRON, async () => {
        const lastRunStr = KV.get('last_date_reminder_date');
        let shouldRun = true;
        if (lastRunStr) {
            const lastRun = new Date(lastRunStr);
            const now = new Date();
            const diffDays = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60 * 24);
            
            if (diffDays < SCHEDULER_CONFIG.BIWEEKLY_MIN_INTERVAL_DAYS) {
                shouldRun = false;
                log.info(`Skipping bi-weekly date reminder, last run was ${Math.round(diffDays)} days ago.`);
            }
        }
        
        if (shouldRun) {
            await this.reminderService.sendBiWeeklyDate();
        }
    }, { timezone: this.timeZone });


    // 4. Monthly Gift
    cron.schedule(SCHEDULER_CONFIG.MONTHLY_GIFT_CRON, () => {
        this.reminderService.sendMonthlyGift();
    }, { timezone: this.timeZone });
    
    log.info('Scheduler initialized.');
  }

  private scheduleRandomCompliment() {
    const today = new Date().toISOString().split('T')[0];
    const lastSent = KV.get('last_compliment_date');

    if (lastSent === today) {
        log.info('Daily compliment already sent today.');
        return;
    }

    const now = new Date();
    const currentHourUtc = now.getUTCHours();
    
    // Window from config (UTC)
    const startHourUtc = SCHEDULER_CONFIG.DAILY_WINDOW_START_UTC;
    const endHourUtc = SCHEDULER_CONFIG.DAILY_WINDOW_END_UTC;

    // Safety check: Don't schedule if it's already late
    if (currentHourUtc >= endHourUtc) {
        log.info('Too late to schedule compliment for today.');
        return;
    }

    let minDelayMs = 0;
    let maxDelayMs = 0;

    const msPerHour = 60 * 60 * 1000;
    
    if (currentHourUtc < startHourUtc) {
        // Before window
        const msUntilStart = (startHourUtc - currentHourUtc) * msPerHour - (now.getMinutes() * 60 * 1000);
        minDelayMs = msUntilStart;
        maxDelayMs = msUntilStart + (endHourUtc - startHourUtc) * msPerHour;
    } else {
        // Inside window
        minDelayMs = 1 * 60 * 1000; // Minimum 1 min from now
        const hoursLeft = endHourUtc - currentHourUtc;
        maxDelayMs = hoursLeft * msPerHour - (now.getMinutes() * 60 * 1000);
    }
    
    if (maxDelayMs <= minDelayMs) {
         log.info('Window passed or negligible.');
         return;
    }

    const randomDelay = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
    
    log.info(`Scheduling daily compliment in ${(randomDelay / 1000 / 60).toFixed(1)} minutes.`);
    
    setTimeout(() => {
        this.reminderService.sendDailyCompliment();
    }, randomDelay);
  }
}
