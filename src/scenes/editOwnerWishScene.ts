import { Scenes } from 'telegraf';
import {
  getOwnerWishById,
  updateOwnerWish,
  deleteOwnerWish,
} from '../services/ownerWishService.js';
import { getCommandsKeyboard } from '../keyboard.js';
import { checkGlobalNavigation } from './utils.js';
import type { BotContext } from '../types.js';

interface EditOwnerWishSceneSession {
  wishId?: number;
}

export const editOwnerWishScene = new Scenes.BaseScene<BotContext>('EDIT_OWNER_WISH');

editOwnerWishScene.enter(async (ctx) => {
  const state = ctx.scene.state as EditOwnerWishSceneSession;
  if (!state.wishId) {
    await ctx.reply('Ошибка: не указан пункт вишлиста.');
    return ctx.scene.leave();
  }

  const user = ctx.state.user!;
  if (user.role !== 'OWNER') {
    await ctx.reply('Эта функция только для парня.');
    return ctx.scene.leave();
  }

  const wish = getOwnerWishById(state.wishId);
  if (!wish || wish.owner_id !== user.id) {
    await ctx.reply('Пункт не найден или был удалён.');
    return ctx.scene.leave();
  }

  await ctx.reply(
    `📋 <b>Редактирование</b>\n\n"${wish.text}"\n\nВыберите действие:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✏️ Изменить текст', callback_data: 'edit_owner_wish_text' }],
          [{ text: '🗑️ Удалить', callback_data: 'delete_owner_wish' }],
          [{ text: '🔙 Назад', callback_data: 'cancel_owner_wish' }],
        ],
      },
    }
  );
});

editOwnerWishScene.action('edit_owner_wish_text', async (ctx) => {
  const state = ctx.scene.state as EditOwnerWishSceneSession;
  const wish = state.wishId ? getOwnerWishById(state.wishId) : undefined;

  await ctx.answerCbQuery();
  if (!wish) {
    await ctx.reply('Пункт не найден.');
    return ctx.scene.leave();
  }

  await ctx.reply(
    `Текущий текст:\n<code>${wish.text}</code>\n\nОтправь новый вариант 👇`,
    { parse_mode: 'HTML' }
  );
});

editOwnerWishScene.action('delete_owner_wish', async (ctx) => {
  const state = ctx.scene.state as EditOwnerWishSceneSession;
  const user = ctx.state.user!;

  await ctx.answerCbQuery('Удалено ✅');
  if (state.wishId) {
    deleteOwnerWish(state.wishId, user.id);
  }
  await ctx.reply('Пункт удалён из вишлиста.', getCommandsKeyboard('OWNER'));
  return ctx.scene.leave();
});

editOwnerWishScene.action('cancel_owner_wish', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Отмена.', getCommandsKeyboard('OWNER'));
  return ctx.scene.leave();
});

editOwnerWishScene.on('text', async (ctx) => {
  const newText = ctx.message.text.trim();
  if (await checkGlobalNavigation(ctx, newText)) return;

  const state = ctx.scene.state as EditOwnerWishSceneSession;
  const user = ctx.state.user!;

  if (newText.length < 1) {
    await ctx.reply('Текст слишком короткий.');
    return;
  }

  if (state.wishId && user.role === 'OWNER') {
    const updated = updateOwnerWish(state.wishId, user.id, newText);
    if (updated) {
      await ctx.reply('✅ Текст обновлён!');
    } else {
      await ctx.reply('Не удалось обновить.');
    }
  }
  return ctx.scene.leave();
});

editOwnerWishScene.on('message', async (ctx) => {
  await ctx.reply('Отправь текст или выбери действие кнопками.');
});
