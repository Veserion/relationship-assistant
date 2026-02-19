import { Telegraf, session } from 'telegraf';
import { Scenes } from 'telegraf';
import { config } from './config.js';
import { whitelistMiddleware } from './middleware/whitelist.js';
import { addWishScene } from './scenes/addWishScene.js';
import { addDateScene } from './scenes/addDateScene.js';
import { editNoteScene } from './scenes/editNoteScene.js';
import { selectRoleScene } from './scenes/selectRoleScene.js';
import { sendMessageScene } from './scenes/sendMessageScene.js';
import { addOwnerWishScene } from './scenes/addOwnerWishScene.js';
import { editOwnerWishScene } from './scenes/editOwnerWishScene.js';
import { registerGlobalCommands } from './commands/global.js';
import { registerPartnerCommands } from './commands/partner.js';
import { registerOwnerCommands } from './commands/owner.js';
import { log } from './logger.js';
import type { BotContext } from './types.js';
import { getUserByTelegramId, getPartner } from './services/userService.js';
import { ComplimentService } from './services/complimentService.js';
import { KV } from './services/kvService.js';
import { Markup } from 'telegraf';
import { DEFAULT_COMMANDS } from './commandsMenu.js';

const stage = new Scenes.Stage<BotContext>([
  addWishScene,
  addDateScene,
  selectRoleScene,
  editNoteScene,
  sendMessageScene,
  addOwnerWishScene,
  editOwnerWishScene,
]);

/** Команды по умолчанию для всех (до выбора роли) */
function setupBotCommands(bot: Telegraf<BotContext>): void {
  bot.telegram.setMyCommands(DEFAULT_COMMANDS);
}

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.botToken!);

  bot.use(session());
  bot.use(whitelistMiddleware);
  bot.use(stage.middleware());
  bot.use(async (ctx, next) => {
    if (!ctx.state.pendingRoleSelection) return next();
    
    const msg = 'message' in ctx.update ? ctx.update.message : ctx.message;
    const text = msg && 'text' in msg && typeof msg.text === 'string' ? msg.text : '';
    
    // Если это команда /start (в т.ч. с параметрами), даем ей пройти в глобальные обработчики.
    // Это предотвращает двойной вход в сцену выбора роли.
    if (text.startsWith('/start')) {
      return next();
    }
    
    return ctx.scene.enter('SELECT_ROLE');
  });

  setupBotCommands(bot);
  registerGlobalCommands(bot);
  registerPartnerCommands(bot);
  registerOwnerCommands(bot);

  // Compliment Actions
  bot.action('send_compliment', async (ctx) => {
    const telegramId = ctx.from!.id;
    const text = KV.get(`pending_compliment_${telegramId}`);
    const user = ctx.state.user;
    
    if (!text) return ctx.answerCbQuery('⚠️ Срок действия предложения истек или произошла ошибка.');
    if (!user) return ctx.answerCbQuery('Ошибка: пользователь не найден.');
    
    const partner = getPartner(user.id);
    if (!partner) return ctx.answerCbQuery('⚠️ У тебя пока не подключена девушка.');
    
    try {
      await ctx.telegram.sendMessage(partner.telegram_id, `❤️ <b>Твой парень прислал тебе комплимент:</b>\n\n"${text}"`, { parse_mode: 'HTML' });
      KV.delete(`pending_compliment_${telegramId}`);
      await ctx.answerCbQuery('✅ Отправлено!');
      await ctx.editMessageText(`✅ Комплимент отправлен твоей девушке!\n\n<i>"${text}"</i>`, { parse_mode: 'HTML' });
    } catch (err) {
      log.error('Failed to send compliment to partner', err);
      await ctx.answerCbQuery('❌ Ошибка при отправке.');
    }
  });

  bot.action('new_compliment', async (ctx) => {
    const telegramId = ctx.from!.id;
    const compliment = ComplimentService.getRandomCompliment();
    KV.set(`pending_compliment_${telegramId}`, compliment);

    const text = `🔔 Напоминание: Самое время порадовать свою девушку! ✨\n\n` +
                 `💡 Предлагаемый вариант (нажми, чтобы скопировать):\n` +
                 `<code>${compliment}</code>`;
    
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🚀 Отправить', 'send_compliment')],
          [Markup.button.callback('🔄 Выдать новый вариант', 'new_compliment')]
        ])
      });
      await ctx.answerCbQuery();
    } catch (err: any) {
      if (err.description?.includes('message is not modified')) {
        return ctx.answerCbQuery('Тот же вариант! Попробуй еще раз.');
      }
      log.error('Failed to update compliment suggestion', err);
      await ctx.answerCbQuery('❌ Ошибка при обновлении.');
    }
  });

  bot.catch((err, ctx) => {
    log.error('Unhandled error', err);
    log.debug('Error context:', {
      updateType: ctx.updateType,
      chatId: ctx.chat?.id,
      fromId: ctx.from?.id,
    });
    ctx.reply('Произошла ошибка. Попробуйте позже.').catch(() => {});
  });

  return bot;
}
