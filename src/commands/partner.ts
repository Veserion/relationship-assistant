import type { Telegraf } from 'telegraf';
import { roleGuard } from '../middleware/roleGuard.js';
import { getNotesByUser, CATEGORY_NAMES } from '../services/noteService.js';
import { getOwnerWishes } from '../services/ownerWishService.js';
import { getPartner } from '../services/userService.js';
import { BTN } from '../keyboard.js';
import type { BotContext } from '../types.js';

const partnerGuard = roleGuard('PARTNER');

export function registerPartnerCommands(bot: Telegraf<BotContext>): void {
  bot.command('wish', partnerGuard, (ctx) => ctx.scene.enter('ADD_WISH'));
  bot.hears(BTN.ADD_WISH, partnerGuard, (ctx) => ctx.scene.enter('ADD_WISH'));

  bot.command('my_notes', partnerGuard, handleMyNotes);
  bot.hears(BTN.MY_NOTES, partnerGuard, handleMyNotes);

  bot.command('owner_wishlist', partnerGuard, handleOwnerWishlistForPartner);
  bot.hears(BTN.OWNER_WISHLIST, partnerGuard, handleOwnerWishlistForPartner);

  bot.action(/^edit_note_(\d+)$/, async (ctx) => {
    const noteId = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery();
    await ctx.scene.enter('EDIT_NOTE', { noteId });
  });
}

export async function handleOwnerWishlistForPartner(ctx: BotContext) {
  const user = ctx.state.user!;
  const owner = getPartner(user.id);
  if (!owner) {
    await ctx.reply('Пока нет связи с парнем. Перейди по его ссылке — тогда здесь появится вишлист 📋');
    return;
  }
  const wishes = getOwnerWishes(owner.id);
  if (!wishes.length) {
    await ctx.reply('Вишлист парня пока пуст. Попроси его добавить хотелки — так проще выбирать подарки 💝');
    return;
  }
  const list = wishes.map((w, i) => `${i + 1}. ${w.text}`).join('\n');
  await ctx.reply(`📋 <b>Вишлист парня</b>\n\n${list}`, { parse_mode: 'HTML' });
}

export async function handleMyNotes(ctx: BotContext) {
  const user = ctx.state.user!;
  const notes = getNotesByUser(user.id);
  
  if (!notes.length) {
    await ctx.reply('Пока пусто. Добавь первое пожелание — твой парень будет рад 💝');
    return;
  }

  const grouped: Record<string, typeof notes> = {};
  notes.forEach(note => {
    const cat = note.category || 'wish';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(note);
  });

  let message = '<b>📝 Твои заметки:</b>\n\n';
  const buttons: any[] = [];
  let globalIndex = 1;

  for (const [cat, items] of Object.entries(grouped)) {
    message += `<b>${CATEGORY_NAMES[cat] || cat}</b>\n`;
    const row: any[] = [];
    
    items.forEach((note) => {
      message += `${globalIndex}. ${note.text}\n`;
      row.push({ text: `✏️ ${globalIndex}`, callback_data: `edit_note_${note.id}` });
      
      // Limit buttons per row to 5
      if (row.length === 5) {
        buttons.push([...row]);
        row.length = 0;
      }
      globalIndex++;
    });
    
    if (row.length > 0) buttons.push(row);
    message += '\n';
  }

  await ctx.reply(message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}

