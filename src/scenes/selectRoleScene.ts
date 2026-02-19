import { Scenes } from 'telegraf';
import { createUserWithRole } from '../services/userService.js';
import { getCommandsKeyboard } from '../keyboard.js';
import { setCommandsForChat } from '../commandsMenu.js';
import { log } from '../logger.js';
import type { BotContext } from '../types.js';

export const selectRoleScene = new Scenes.BaseScene<BotContext>('SELECT_ROLE');

const ROLE_OWNER = 'role:OWNER';
const ROLE_PARTNER = 'role:PARTNER';

const WELCOME_GUIDE =
  `Привет! 👋\n\n` +
  `Я — бот для пары: помогаю не забывать важное и держать всё в одном месте.\n\n` +
  `Здесь можно вести общие даты (др, годовщины), напоминать друг другу о знаках внимания и подарках, обмениваться пожеланиями и идеями. Парень ведет календарь и напоминания, девушка — добавляет свои хотелки и заметки; вы оба видите общее и можете писать друг другу через бота.\n\n` +
  `Чтобы начать, выбери, кто ты в паре 👇`;

selectRoleScene.enter(async (ctx) => {
  const state = ctx.scene.state as { rolePromptSentAt?: number };
  if (state.rolePromptSentAt && Date.now() - state.rolePromptSentAt < 3000) {
    return;
  }
  state.rolePromptSentAt = Date.now();

  const telegramId = ctx.state.pendingRoleSelection ?? ctx.from?.id;
  if (!telegramId) {
    log.warn('selectRole: no telegramId');
    return ctx.scene.leave();
  }

  const msg = 'message' in ctx.update ? ctx.update.message : null;
  const text = msg && 'text' in msg && typeof msg.text === 'string' ? msg.text.trim() : '';
  const isFirstEntry = /^\/start\s*$/.test(text);
  if (isFirstEntry) {
    await ctx.reply(WELCOME_GUIDE);
  }

  await ctx.reply('👫 Кто вы в паре?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '👨 Парень', callback_data: ROLE_OWNER }],
        [{ text: '👩 Девушка', callback_data: ROLE_PARTNER }]
      ],
    },
  });
});

selectRoleScene.action(ROLE_OWNER, async (ctx) => {
  const telegramId = ctx.from!.id;
  const user = createUserWithRole(telegramId, 'OWNER');
  ctx.state.user = user;
  ctx.state.pendingRoleSelection = undefined;
  
  await ctx.answerCbQuery();
  
  const botInfo = await ctx.telegram.getMe();
  const inviteLink = `https://t.me/${botInfo.username}?start=pair_${telegramId}`;
  
  const keyboard = getCommandsKeyboard('OWNER', false);
  await setCommandsForChat(ctx, 'OWNER');
  await ctx.reply(
    `✅ Ты — тот самый парень! 👨\n\n` +
    `👋 Я помогу тебе не забывать важное для вас двоих: даты, идеи и пожелания твоей девушки.\n\n` +
    `📌 Что ты можешь делать:\n` +
    `• 📅 Добавлять даты — день рождения, годовщина, важные события; бот напомнит заранее\n` +
    `• 💌 Смотреть пожелания девушки — подарки, идеи, что для неё важно\n` +
    `• 💝 Отправлять комплименты и напоминания себе порадовать свою половинку\n\n` +
    `🔒 Наша база зашифрована — ваши данные в безопасности.\n\n` +
    `⏰ Расписание уведомлений (для тебя):\n` +
    `• Комплимент — раз в день (случайное время с 10:00 до 22:00)\n` +
    `• Знак внимания — раз в неделю, по пятницам в 17:00\n` +
    `• Свидание — раз в 2 недели, по понедельникам в 10:00\n` +
    `• Подарок — раз в месяц, 1-го числа в 12:00\n\n` +
    `📅 Напоминания о добавленных датах (др, годовщины) — каждый день в 9:00\n\n` +
    `🔗 Отправь эту ссылку своей девушке, чтобы связать аккаунты:\n` +
    `${inviteLink}\n\n` +
    `Когда она перейдёт по ссылке, вы сможете обмениваться пожеланиями и видеть общие даты.`,
    { reply_markup: keyboard.reply_markup }
  );
  return ctx.scene.leave();
});

selectRoleScene.action(ROLE_PARTNER, async (ctx) => {
  const telegramId = ctx.state.pendingRoleSelection ?? ctx.from?.id;
  if (!telegramId) {
    await ctx.answerCbQuery();
    return ctx.scene.leave();
  }
  const user = createUserWithRole(telegramId, 'PARTNER');
  ctx.state.user = user;
  ctx.state.pendingRoleSelection = undefined;
  await ctx.answerCbQuery();

  const botInfo = await ctx.telegram.getMe();
  const inviteLink = `https://t.me/${botInfo.username}?start=pair_${telegramId}`;

  const keyboard = getCommandsKeyboard('PARTNER', false);
  await setCommandsForChat(ctx, 'PARTNER');
  await ctx.reply(
    `✅ Ты — та самая девушка! 👩\n\n` +
    `👋 Я помогу тебе делиться с парнем тем, что важно: пожелания, идеи подарков, планы.\n\n` +
    `📌 Что ты можешь делать:\n` +
    `• 💝 Добавлять пожелание — записать, что хочешь, идею подарка или важную мысль; твой парень это увидит\n` +
    `• 📝 Мои заметки — хранить и просматривать свои записи\n` +
    `• 📅 Видеть общие даты пары — годовщины, дни рождения и другие напоминания\n\n` +
    `🔒 Наша база зашифрована — ваши данные в безопасности.\n\n` +
    `🔗 Отправь эту ссылку своему парню, чтобы связать аккаунты:\n` +
    `${inviteLink}\n\n` +
    `Когда он перейдёт по ссылке, вы сможете обмениваться пожеланиями и видеть общие даты.`,
    { reply_markup: keyboard.reply_markup }
  );
  return ctx.scene.leave();
});
