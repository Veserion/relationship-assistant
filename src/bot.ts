import { Telegraf, session } from 'telegraf';
import { Scenes } from 'telegraf';
import { config } from './config.js';
import { whitelistMiddleware } from './middleware/whitelist.js';
import { addWishScene } from './scenes/addWishScene.js';
import { addDateScene } from './scenes/addDateScene.js';
import { editNoteScene } from './scenes/editNoteScene.js';
import { selectRoleScene } from './scenes/selectRoleScene.js';
import { registerGlobalCommands } from './commands/global.js';
import { registerPartnerCommands } from './commands/partner.js';
import { registerOwnerCommands } from './commands/owner.js';
import { initScheduler } from './scheduler/index.js';
import { log } from './logger.js';
import type { BotContext } from './types.js';

const stage = new Scenes.Stage<BotContext>([addWishScene, addDateScene, selectRoleScene, editNoteScene]);

function setupBotCommands(bot: Telegraf<BotContext>): void {
  bot.telegram.setMyCommands([
    { command: 'start', description: '🏠 Главная' },
    { command: 'help', description: '❓ Помощь' },
    { command: 'wish', description: '💝 Добавить пожелание' },
    { command: 'my_notes', description: '📝 Мои заметки' },
    { command: 'date', description: '📅 Добавить дату' },
    { command: 'dates', description: '📆 Мои даты' },
    { command: 'wishes', description: '💌 От второй половинки' },
  ]);
}

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.botToken!);

  bot.use(session());
  bot.use(whitelistMiddleware);
  bot.use(stage.middleware());
  bot.use(async (ctx, next) => {
    if (ctx.state.pendingRoleSelection) {
      return ctx.scene.enter('SELECT_ROLE');
    }
    return next();
  });

  setupBotCommands(bot);
  registerGlobalCommands(bot);
  registerPartnerCommands(bot);
  registerOwnerCommands(bot);

  bot.catch((err, ctx) => {
    log.error('Unhandled error', err);
    log.debug('Error context:', {
      updateType: ctx.updateType,
      chatId: ctx.chat?.id,
      fromId: ctx.from?.id,
    });
    ctx.reply('Произошла ошибка. Попробуйте позже.').catch(() => {});
  });

  initScheduler(bot);

  return bot;
}
