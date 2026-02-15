import { Scenes } from 'telegraf';
import { addNote } from '../services/noteService.js';
import { getCommandsKeyboard } from '../keyboard.js';
import { checkGlobalNavigation } from './utils.js';
import type { BotContext } from '../types.js';

interface AddWishSceneSession {
  text?: string;
  category?: string;
}

export const addWishScene = new Scenes.BaseScene<BotContext>('ADD_WISH');

addWishScene.enter(async (ctx) => {
  const state = ctx.scene.state as AddWishSceneSession;
  state.text = undefined;
  state.category = undefined;
  
  await ctx.reply('📂 Выбери категорию для пожелания:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎁 Подарок', callback_data: 'gift' }, { text: '🥰 Знак внимания', callback_data: 'attention' }],
        [{ text: '💡 Идея для свидания', callback_data: 'date_idea' }, { text: '📍 Место', callback_data: 'place' }],
        [{ text: '✨ Другое', callback_data: 'wish' }],
      ]
    }
  });
});

addWishScene.action(/^(gift|attention|date_idea|place|wish)$/, async (ctx) => {
  const category = ctx.match[1];
  const state = ctx.scene.state as AddWishSceneSession;
  state.category = category;

  await ctx.answerCbQuery();
  await ctx.editMessageText(`📂 Категория: <b>${getCategoryName(category)}</b>\n\n✍️ Теперь напиши, чего именно тебе хочется:`, { parse_mode: 'HTML' });
});

addWishScene.on('text', async (ctx) => {
  const text = ctx.message.text?.trim();
  if (await checkGlobalNavigation(ctx, text)) return;

  const state = ctx.scene.state as AddWishSceneSession;
  
  if (!state.category) {
    await ctx.reply('Пожалуйста, сначала выберите категорию кнопками выше ⬆️');
    return;
  }

  if (!text || text.length < 2) {
    await ctx.reply('Пожалуйста, введите текст (минимум 2 символа).');
    return;
  }

  const user = ctx.state.user!;
  addNote(user.id, text, state.category);
  const role = user.role as 'OWNER' | 'PARTNER';

  if (role === 'PARTNER') {
    const { config } = await import('../config.js');
    try {
      await ctx.telegram.sendMessage(
        config.ownerId,
        `🔔 <b>Твоя половинка добавила новое желание:</b>\n\n📂 ${getCategoryName(state.category)}\n📝 "${text}"`,
        { parse_mode: 'HTML' }
      );
    } catch (e) {
      console.error('Failed to send notification to owner', e);
    }
  }
  
  await ctx.reply(`✅ Записано в категорию «${getCategoryName(state.category)}»!`, getCommandsKeyboard(role));
  return ctx.scene.leave();
});

addWishScene.on('message', async (ctx) => {
  await ctx.reply('Пожалуйста, отправьте текстовое сообщение или выберите категорию.');
});

function getCategoryName(key: string): string {
  const map: Record<string, string> = {
    gift: 'Подарок',
    attention: 'Знак внимания',
    date_idea: 'Идея для свидания',
    place: 'Место',
    wish: 'Желание/Другое'
  };
  return map[key] ?? key;
}
