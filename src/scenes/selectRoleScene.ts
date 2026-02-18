import { Scenes } from 'telegraf';
import { createUserWithRole } from '../services/userService.js';
import { getCommandsKeyboard } from '../keyboard.js';
import { setCommandsForChat } from '../commandsMenu.js';
import { log } from '../logger.js';
import type { BotContext } from '../types.js';

export const selectRoleScene = new Scenes.BaseScene<BotContext>('SELECT_ROLE');

const ROLE_OWNER = 'role:OWNER';
const ROLE_PARTNER = 'role:PARTNER';

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
  await ctx.reply('👫 Кто вы в паре?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '👑 Организатор (даты, напоминания)', callback_data: ROLE_OWNER }],
        [{ text: '💝 Партнёр (пожелания и идеи)', callback_data: ROLE_PARTNER }]
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
    `✅ Вы — организатор!\n\n` +
    `👋 Я помогу вам не забывать важное для вас двоих: даты, идеи и пожелания половинки.\n\n` +
    `📌 Что вы можете делать:\n` +
    `• 📅 Добавлять даты — день рождения, годовщина, важные события; бот напомнит заранее\n` +
    `• 💌 Смотреть пожелания партнёра — подарки, идеи, что для него важно\n` +
    `• 💝 Отправлять комплименты и напоминания себе порадовать вторую половинку\n\n` +
    `🔒 Наша база зашифрована — ваши данные в безопасности.\n\n` +
    `⏰ Расписание уведомлений (для организатора):\n` +
    `• Комплимент — раз в день (случайное время с 10:00 до 22:00)\n` +
    `• Знак внимания — раз в неделю, по пятницам в 17:00\n` +
    `• Свидание — раз в 2 недели, по понедельникам в 10:00\n` +
    `• Подарок — раз в месяц, 1-го числа в 12:00\n\n` +
    `📅 Напоминания о добавленных датах (др, годовщины) — каждый день в 9:00\n\n` +
    `🔗 Отправьте эту ссылку вашей половинке, чтобы связать аккаунты:\n` +
    `${inviteLink}\n\n` +
    `Когда партнёр перейдёт по ссылке, вы сможете обмениваться пожеланиями и видеть общие даты.`,
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
    `✅ Вы — партнёр!\n\n` +
    `👋 Я помогу вам делиться с половинкой тем, что важно: пожелания, идеи подарков, планы.\n\n` +
    `📌 Что вы можете делать:\n` +
    `• 💝 Добавлять пожелание — записать, что хочешь, идею подарка или важную мысль; организатор это увидит\n` +
    `• 📝 Мои заметки — хранить и просматривать свои записи\n` +
    `• 📅 Видеть общие даты пары — годовщины, дни рождения и другие напоминания\n\n` +
    `🔒 Наша база зашифрована — ваши данные в безопасности.\n\n` +
    `🔗 Отправьте эту ссылку вашей половинке, чтобы связать аккаунты:\n` +
    `${inviteLink}\n\n` +
    `Когда партнёр перейдёт по ссылке, вы сможете обмениваться пожеланиями и видеть общие даты.`,
    { reply_markup: keyboard.reply_markup }
  );
  return ctx.scene.leave();
});
