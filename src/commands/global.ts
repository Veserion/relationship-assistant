import type { Telegraf } from 'telegraf';
import { BTN, getCommandsKeyboard } from '../keyboard.js';
import { setCommandsForChat } from '../commandsMenu.js';
import type { BotContext } from '../types.js';
import { getUserByTelegramId, createUserWithRole, linkPair, getPartner } from '../services/userService.js';

export async function sendStart(ctx: BotContext) {
  // Deep link: t.me/bot?start=pair_123 → message.text = "/start pair_123"
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
  const payload = text.startsWith('/start') ? text.replace(/^\/start\s*/, '').trim() : undefined;

  if (payload && payload.startsWith('pair_')) {
    const inviterId = parseInt(payload.split('_')[1], 10);
    const inviter = getUserByTelegramId(inviterId);
    
    if (inviter && inviter.telegram_id !== ctx.from?.id) {
      // User came via invite link
      const joinerRole = inviter.role === 'OWNER' ? 'PARTNER' : 'OWNER';
      const user = ctx.state.user || createUserWithRole(ctx.from!.id, joinerRole);
      
      try {
        const ownerTg = inviter.role === 'OWNER' ? inviter.telegram_id : user.telegram_id;
        const partnerTg = inviter.role === 'OWNER' ? user.telegram_id : inviter.telegram_id;
        
        linkPair(ownerTg, partnerTg);
        ctx.state.user = user;
        ctx.state.pendingRoleSelection = undefined;
        const roleLabel = joinerRole === 'OWNER' ? 'Парень' : 'Девушка';
        const keyboard = getCommandsKeyboard(joinerRole as 'OWNER' | 'PARTNER');
        const roleIntro = joinerRole === 'OWNER'
          ? 'Ты можешь добавлять даты и напоминания, смотреть пожелания девушки и отправлять комплименты.'
          : 'Ты можешь добавлять пожелания и идеи — твой парень их увидит; также доступны общие даты пары.';
        await setCommandsForChat(ctx, joinerRole as 'OWNER' | 'PARTNER');
        await ctx.reply(
          `❤️ Вы успешно связаны! Твоя роль: ${roleLabel}\n\n` +
            `👋 ${roleIntro}\n\n` +
            `🔒 Наша база зашифрована — ваши данные в безопасности.\n\n` +
            `Выбирай действие на кнопках ниже 👇`,
          keyboard
        );
        return;
      } catch (err) {
        console.error('Failed to link pair:', err);
      }
    }
  }

  if (ctx.state.pendingRoleSelection) {
    return ctx.scene.enter('SELECT_ROLE');
  }

  const user = ctx.state.user;
  if (!user) return ctx.scene.enter('SELECT_ROLE');

  const role = user.role as 'OWNER' | 'PARTNER';
  const hasPartner = !!getPartner(user.id);
  const keyboard = getCommandsKeyboard(role, hasPartner);
  await setCommandsForChat(ctx, role);
  await ctx.reply(
    `👋 Привет! Я помогу вам не забывать важное.\n\n` +
      `📌 Ты: ${role === 'OWNER' ? 'парень (даты и напоминания)' : 'девушка (пожелания и идеи)'}\n\n` +
      `Выбирай действие на кнопках ниже 👇`,
    keyboard
  );
}

export async function sendHelp(ctx: BotContext) {
  const user = ctx.state.user;
  const role = user?.role;
  let text = '📖 Справка\n\n';
  text += '🛠 Общее:\n';
  text += '• Главная — меню бота\n';
  text += '• Помощь — эта справка\n';
  text += '• Написать — отправить своей половинке сообщение или стикер\n';
  text += '• Сбросить роль — если ошибся с выбором (пока пара не привязана)\n\n';
  if (role === 'PARTNER') {
    text += '💝 Твои пожелания (девушка):\n';
    text += '• Добавить пожелание — записать, что важно для тебя, подарок, идею\n';
    text += '• Мои заметки — твои сохранённые пожелания\n';
    text += '• Мои даты — общие даты пары (годовщины, др и т.д.)\n';
    text += '• Вишлист парня — что хочет твой парень (для подарков)\n';
  }
  if (role === 'OWNER') {
    text += '📅 Даты для пары (парень):\n';
    text += '• Добавить дату — день рождения, годовщина, важное событие\n';
    text += '• Мои даты — напоминания о важных датах\n\n';
    text += '💌 От твоей девушки:\n';
    text += '• Пожелания девушки — что хочет твоя девушка\n\n';
    text += '📋 Мой вишлист:\n';
    text += '• Добавить в вишлист — твои хотелки без категорий\n';
    text += '• Мой вишлист — список с редактированием и удалением\n';
  }
  await ctx.reply(text);
}

export function registerGlobalCommands(bot: Telegraf<BotContext>): void {
  bot.command('start', sendStart);
  bot.hears(BTN.MAIN, sendStart);

  bot.command('help', sendHelp);
  bot.hears(BTN.HELP, sendHelp);
  
  bot.hears(BTN.SEND_MESSAGE, (ctx) => ctx.scene.enter('SEND_MESSAGE'));
  bot.hears(BTN.RESET_ROLE, async (ctx) => {
    const user = ctx.state.user;
    if (!user) return ctx.scene.enter('SELECT_ROLE');
    if (getPartner(user.id)) {
      const partnerLabel = user.role === 'OWNER' ? 'девушка' : 'парень';
      await ctx.reply(`Сброс роли доступен только пока пара не привязана. У тебя уже есть ${partnerLabel}.`);
      return;
    }
    return ctx.scene.enter('SELECT_ROLE');
  });

  // ADD_DATE available for both
  bot.command('date', (ctx) => ctx.scene.enter('ADD_DATE'));
  bot.hears(BTN.ADD_DATE, (ctx) => ctx.scene.enter('ADD_DATE'));
}
