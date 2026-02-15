import { Scenes } from 'telegraf';
import { createUserWithRole } from '../services/userService.js';
import { getCommandsKeyboard } from '../keyboard.js';
import { log } from '../logger.js';
import type { BotContext } from '../types.js';

export const selectRoleScene = new Scenes.BaseScene<BotContext>('SELECT_ROLE');

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
      inline_keyboard: [[{ text: '💝 Партнёр (пожелания и идеи)', callback_data: ROLE_PARTNER }]],
    },
  });
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
  const keyboard = getCommandsKeyboard('PARTNER');
  await ctx.reply(
    '✅ Вы — партнёр. Добавляй пожелания — твоя половинка их увидит 💝',
    { reply_markup: keyboard.reply_markup }
  );
  return ctx.scene.leave();
});
