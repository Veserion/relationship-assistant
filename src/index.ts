import './loadEnv.js';
import { createBot } from './bot.js';
import { config } from './config.js';
import { closeDb } from './db/index.js';
import { migrateCategories } from './db/migrations.js';

// Run migrations on startup
migrateCategories();

async function main(): Promise<void> {
  if (!config.botToken) {
    console.error('BOT_TOKEN is required. Copy .env.example to .env and fill it.');
    process.exit(1);
  }
  if (isNaN(config.ownerId) || isNaN(config.partnerId)) {
    console.error('OWNER_ID and PARTNER_ID must be valid Telegram user IDs.');
    process.exit(1);
  }

  const bot = createBot();

  // Initialize Scheduler
  // We need to pass the bot instance to the scheduler so it can send messages
  const { SchedulerService } = await import('./services/scheduler.js');
  const scheduler = new SchedulerService(bot);
  scheduler.init();

  bot.launch().then(() => {
    console.log('Relationship Reminder Bot started.');
  });

  process.once('SIGINT', () => {
    bot.stop('SIGINT');
    closeDb();
  });
  process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    closeDb();
  });
}

main();
