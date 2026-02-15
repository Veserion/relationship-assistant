// -----------------------------------------------------------------------------------------
// PRODUCTION CONFIG
// -----------------------------------------------------------------------------------------
export const SCHEDULER_CONFIG = {
  // Timezone
  TIMEZONE: 'Asia/Yekaterinburg',

  // 1. Daily Compliment
  // Cron: Run at 8:00 AM to schedule the random time
  DAILY_COMPLIMENT_CRON: '0 8 * * *', 
  // Window start/end hours (in UTC) for the random message
  // UTC+5: 10:00 - 22:00 local = 05:00 - 17:00 UTC
  DAILY_WINDOW_START_UTC: 5,
  DAILY_WINDOW_END_UTC: 17,

  // 2. Weekly Attention
  // Cron: Fridays at 17:00 local
  WEEKLY_ATTENTION_CRON: '0 17 * * 5',

  // 3. Bi-weekly Date
  // Cron: Mondays at 10:00 local (Base check)
  BIWEEKLY_DATE_CRON: '0 10 * * 1',
  // Minimum days between date reminders
  BIWEEKLY_MIN_INTERVAL_DAYS: 12,

  // 4. Monthly Gift
  // Cron: 1st of month at 12:00 local
  MONTHLY_GIFT_CRON: '0 12 1 * *',
} as const;

// -----------------------------------------------------------------------------------------
// TEST CONFIG (Uncomment to use for rapid testing)
// -----------------------------------------------------------------------------------------
/*
export const SCHEDULER_CONFIG = {
  TIMEZONE: 'Asia/Yekaterinburg',
  
  // 1. Daily Compliment: Every 2 minutes
  DAILY_COMPLIMENT_CRON: '*\/2 * * * *', 
  DAILY_WINDOW_START_UTC: 0,
  DAILY_WINDOW_END_UTC: 23,

  // 2. Weekly Attention: Every 3 minutes
  WEEKLY_ATTENTION_CRON: '*\/3 * * * *',

  // 3. Bi-weekly Date: Every 4 minutes
  BIWEEKLY_DATE_CRON: '*\/4 * * * *',
  BIWEEKLY_MIN_INTERVAL_DAYS: 0,

  // 4. Monthly Gift: Every 5 minutes
  MONTHLY_GIFT_CRON: '*\/5 * * * *',
} as const;
*/
