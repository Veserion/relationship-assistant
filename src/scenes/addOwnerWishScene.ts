import { Scenes } from 'telegraf';
import { addOwnerWish } from '../services/ownerWishService.js';
import { getCommandsKeyboard } from '../keyboard.js';
import { checkGlobalNavigation } from './utils.js';
import type { BotContext } from '../types.js';

export const addOwnerWishScene = new Scenes.BaseScene<BotContext>('ADD_OWNER_WISH');

addOwnerWishScene.enter(async (ctx) => {
  await ctx.reply('📋 Напиши, что хочешь добавить в свой вишлист:');
});

addOwnerWishScene.on('text', async (ctx) => {
  const text = ctx.message.text?.trim();
  if (await checkGlobalNavigation(ctx, text ?? '')) return;

  if (!text || text.length < 1) {
    await ctx.reply('Напиши хотя бы пару слов 👇');
    return;
  }

  const user = ctx.state.user!;
  if (user.role !== 'OWNER') {
    await ctx.reply('Эта функция только для организатора.');
    return ctx.scene.leave();
  }

  addOwnerWish(user.id, text);
  await ctx.reply('✅ Добавлено в вишлист!', getCommandsKeyboard('OWNER'));
  return ctx.scene.leave();
});

addOwnerWishScene.on('message', async (ctx) => {
  await ctx.reply('Отправь текстовое сообщение.');
});
