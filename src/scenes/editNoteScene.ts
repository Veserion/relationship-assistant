import { Scenes } from 'telegraf';
import { getNoteById, updateNote, deleteNote } from '../services/noteService.js';
import { getCommandsKeyboard } from '../keyboard.js';
import type { BotContext } from '../types.js';
import { getPartner } from '../services/userService.js';

interface EditNoteSceneSession {
  noteId?: number;
}

export const editNoteScene = new Scenes.BaseScene<BotContext>('EDIT_NOTE');

editNoteScene.enter(async (ctx) => {
  const state = ctx.scene.state as EditNoteSceneSession;
  if (!state.noteId) {
    await ctx.reply('Ошибка: не указан ID заметки.');
    return ctx.scene.leave();
  }

  const note = getNoteById(state.noteId);
  if (!note) {
    await ctx.reply('Заметка не найдена или была удалена.');
    return ctx.scene.leave();
  }

  await ctx.reply(
    `📝 <b>Редактирование заметки</b>\n\n"${note.text}"\n\nВыберите действие:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✏️ Изменить текст', callback_data: 'edit_text' }],
          [{ text: '🗑️ Удалить', callback_data: 'delete_note' }],
          [{ text: '🔙 Назад', callback_data: 'cancel' }],
        ],
      },
    }
  );
});

editNoteScene.action('edit_text', async (ctx) => {
  const state = ctx.scene.state as EditNoteSceneSession;
  const note = getNoteById(state.noteId!);

  await ctx.answerCbQuery();
  if (!note) {
    await ctx.reply('Ошибка: заметка не найдена.');
    return ctx.scene.leave();
  }

  await ctx.reply(
    `Текущий текст (нажми, чтобы скопировать):\n<code>${note.text}</code>\n\nОтправь мне измененный вариант 👇`,
    { parse_mode: 'HTML' }
  );
});

editNoteScene.action('delete_note', async (ctx) => {
  const state = ctx.scene.state as EditNoteSceneSession;
  if (state.noteId) {
    const note = getNoteById(state.noteId);
    deleteNote(state.noteId);
    await ctx.answerCbQuery('Заметка удалена ✅');
    
    if (note && ctx.state.user?.role === 'PARTNER') {
      const partner = getPartner(ctx.state.user.id);
      if (partner) {
        try {
          await ctx.telegram.sendMessage(
            partner.telegram_id,
            `🔔 <b>Твоя девушка удалила желание:</b>\n\n🗑️ "${note.text}"`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {
          console.error('Failed to send notification to owner', e);
        }
      }
    }

    // Refresh notes list by triggering the command handler manually or just replying
    const user = ctx.state.user!;
    const role = user.role as 'OWNER' | 'PARTNER';
    await ctx.reply('Заметка удалена.', getCommandsKeyboard(role));
  }
  return ctx.scene.leave();
});

editNoteScene.action('cancel', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Отмена.', getCommandsKeyboard(ctx.state.user!.role as 'OWNER' | 'PARTNER'));
  return ctx.scene.leave();
});

import { checkGlobalNavigation } from './utils.js';

editNoteScene.on('text', async (ctx) => {
  const newText = ctx.message.text.trim();
  if (await checkGlobalNavigation(ctx, newText)) return;

  const state = ctx.scene.state as EditNoteSceneSession;
  
  if (newText.length < 2) {
    await ctx.reply('Текст слишком короткий. Попробуйте еще раз.');
    return;
  }

  if (state.noteId) {
    const oldNote = getNoteById(state.noteId);
    updateNote(state.noteId, newText);
    await ctx.reply('✅ Текст заметки обновлен!');

    if (oldNote && ctx.state.user?.role === 'PARTNER') {
      const partner = getPartner(ctx.state.user.id);
      if (partner) {
        try {
          await ctx.telegram.sendMessage(
            partner.telegram_id,
            `🔔 <b>Твоя девушка изменила желание:</b>\n\n🔴 Было: "${oldNote.text}"\n🟢 Стало: "${newText}"`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {
          console.error('Failed to send notification to owner', e);
        }
      }
    }
  }
  
  return ctx.scene.leave();
});

editNoteScene.on('message', async (ctx) => {
   await ctx.reply('Пожалуйста, отправьте текстовое сообщение или используйте кнопки.');
});
