import { Scenes } from 'telegraf';
import { getCommandsKeyboard } from '../keyboard.js';
import { checkGlobalNavigation } from './utils.js';
import type { BotContext } from '../types.js';
import { getPartner } from '../services/userService.js';

interface SendMessageSceneSession {
  // empty for now, or maybe 'recipientId' if we had multiple
}

export const sendMessageScene = new Scenes.BaseScene<BotContext>('SEND_MESSAGE');

sendMessageScene.enter(async (ctx) => {
  await ctx.reply('✍️ Напишите сообщение для вашей половинки:');
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

  console.log('Sending message:', {
    fromId: ctx.from.id,
    fromRole: currentUser.role,
    toId: recipientId,
    text: text
  });

  // Send to recipient
  try {
    const senderName = ctx.from.first_name || (currentUser.role === 'OWNER' ? 'Владелец' : 'Партнёр');
    
    await ctx.telegram.sendMessage(
        recipientId, 
        `📩 <b>Сообщение от ${senderName}:</b>\n\n<tg-spoiler>${text}</tg-spoiler>`, 
        { parse_mode: 'HTML' }
    );
    await ctx.reply('✅ Сообщение отправлено!', getCommandsKeyboard(currentUser.role));
  } catch (err) {
    console.error('Failed to send message:', err);
    await ctx.reply('❌ Не удалось отправить сообщение. Возможно, пользователь заблокировал бота.');
  }

  return ctx.scene.leave();
});

sendMessageScene.on('message', async (ctx) => {
    await ctx.reply('Пожалуйста, отправьте текстовое сообщение.');
});
