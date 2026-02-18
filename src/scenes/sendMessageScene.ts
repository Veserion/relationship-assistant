import { Scenes } from 'telegraf';
import { getCommandsKeyboard } from '../keyboard.js';
import { checkGlobalNavigation } from './utils.js';
import type { BotContext } from '../types.js';
import { getPartner } from '../services/userService.js';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface SendMessageSceneSession {
  // empty for now, or maybe 'recipientId' if we had multiple
}

export const sendMessageScene = new Scenes.BaseScene<BotContext>('SEND_MESSAGE');

sendMessageScene.enter(async (ctx) => {
  await ctx.reply(
    '✍️ Напишите сообщение или отправьте стикер для вашей половинки:\n\n' +
    'Можно отправить текст или любой стикер из своих наборов.'
  );
});

sendMessageScene.on('sticker', async (ctx) => {
  const currentUser = ctx.state.user!;
  const partner = getPartner(currentUser.id);

  if (!partner) {
    await ctx.reply('⚠️ У вас пока не подключена вторая половинка. Отправьте ей ссылку для подключения!');
    return ctx.scene.leave();
  }

  const fileId = ctx.message.sticker.file_id;
  try {
    await ctx.telegram.sendSticker(partner.telegram_id, fileId);
    const senderName = ctx.from?.first_name ?? (currentUser.role === 'OWNER' ? 'Организатор' : 'Партнёр');
    await ctx.telegram.sendMessage(partner.telegram_id, `💝 Стикер от ${senderName}`, { parse_mode: 'HTML' }).catch(() => {});
    await ctx.reply('✅ Стикер отправлен!', getCommandsKeyboard(currentUser.role as 'OWNER' | 'PARTNER'));
  } catch (err) {
    console.error('Failed to send sticker:', err);
    await ctx.reply('❌ Не удалось отправить. Возможно, половинка заблокировала бота.');
  }
  return ctx.scene.leave();
});

sendMessageScene.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (await checkGlobalNavigation(ctx, text)) return;

  if (text.length < 1) {
    await ctx.reply('Сообщение не может быть пустым.');
    return;
  }

  const currentUser = ctx.state.user!;
  
  const partner = getPartner(currentUser.id);
  
  if (!partner) {
    await ctx.reply('⚠️ У вас пока не подключена вторая половинка. Отправьте ей ссылку для подключения!');
    return ctx.scene.leave();
  }

  const recipientId = partner.telegram_id;
  const senderName = ctx.from.first_name || (currentUser.role === 'OWNER' ? 'Владелец' : 'Партнёр');

  const hasCustomEmoji = ctx.message.entities?.some(
    (e: { type?: string }) => e.type === 'custom_emoji'
  );

  try {
    if (hasCustomEmoji && ctx.message.entities) {
      const prefix = `📩 Сообщение от ${senderName}:\n\n`;
      const fullText = prefix + text;
      const textStartOffset = prefix.length;

      type EntityItem =
        | { type: 'bold'; offset: number; length: number }
        | { type: 'spoiler'; offset: number; length: number }
        | { type: 'custom_emoji'; offset: number; length: number; custom_emoji_id: string };
      const entities: EntityItem[] = [
        { type: 'bold', offset: 0, length: (`📩 Сообщение от ${senderName}:`).length },
        { type: 'spoiler', offset: textStartOffset, length: text.length },
      ];
      for (const e of ctx.message.entities) {
        const ent = e as { type?: string; offset: number; length: number; custom_emoji_id?: string };
        if (ent.type === 'custom_emoji' && ent.custom_emoji_id) {
          entities.push({
            type: 'custom_emoji',
            offset: ent.offset + textStartOffset,
            length: ent.length,
            custom_emoji_id: ent.custom_emoji_id,
          });
        }
      }
      entities.sort((a, b) => a.offset - b.offset);

      await ctx.telegram.sendMessage(recipientId, fullText, { entities });
    } else {
      await ctx.telegram.sendMessage(
        recipientId,
        `📩 <b>Сообщение от ${senderName}:</b>\n\n<tg-spoiler>${escapeHtml(text)}</tg-spoiler>`,
        { parse_mode: 'HTML' }
      );
    }
    await ctx.reply('✅ Сообщение отправлено!', getCommandsKeyboard(currentUser.role));
  } catch (err) {
    console.error('Failed to send message:', err);
    await ctx.reply('❌ Не удалось отправить сообщение. Возможно, пользователь заблокировал бота.');
  }

  return ctx.scene.leave();
});

sendMessageScene.on('message', async (ctx) => {
  await ctx.reply('Отправьте, пожалуйста, текст или стикер.');
});
