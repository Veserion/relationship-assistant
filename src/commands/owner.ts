import type { Telegraf } from 'telegraf';
import { roleGuard } from '../middleware/roleGuard.js';
import { getDatesByOwner } from '../services/dateService.js';
import { getNotesForOwner, CATEGORY_NAMES } from '../services/noteService.js';
import { BTN } from '../keyboard.js';
import type { BotContext } from '../types.js';
import { ComplimentService } from '../services/complimentService.js';
import { KV } from '../services/kvService.js';
import { Markup } from 'telegraf';

const ownerGuard = roleGuard('OWNER');

export function registerOwnerCommands(bot: Telegraf<BotContext>): void {
  bot.command('date', ownerGuard, (ctx) => ctx.scene.enter('ADD_DATE'));
  bot.hears(BTN.ADD_DATE, ownerGuard, (ctx) => ctx.scene.enter('ADD_DATE'));

  bot.command('dates', ownerGuard, handleMyDates);
  bot.hears(BTN.MY_DATES, ownerGuard, handleMyDates);

  bot.command('wishes', ownerGuard, handlePartnerWishes);
  bot.hears(BTN.PARTNER_WISHES, ownerGuard, handlePartnerWishes);

  bot.command('compliment', ownerGuard, handleCompliment);
  bot.hears(BTN.COMPLIMENTS, ownerGuard, handleCompliment);
}

export async function handleMyDates(ctx: BotContext) {
  const user = ctx.state.user!;
  const dates = getDatesByOwner(user.id);
  if (!dates.length) {
    await ctx.reply('Пока нет дат. Добавь годовщину, день рождения или другой важный день 📅');
    return;
  }
  const list = dates
    .map((d) => `• ${d.title} — ${d.date} (напоминание за ${d.remind_before_days} дн.)`)
    .join('\n');
  await ctx.reply(`📅 Даты для вас двоих:\n\n${list}`);
}

export async function handlePartnerWishes(ctx: BotContext) {
  const user = ctx.state.user!;
  const notes = getNotesForOwner(user.id).slice(0, 50);
  if (!notes.length) {
    await ctx.reply('Пока твоя половинка ничего не добавила 💌');
    return;
  }

  const grouped: Record<string, typeof notes> = {};
  notes.forEach((note) => {
    const cat = note.category || 'wish';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(note);
  });

  let message = '<b>💝 Что хочет твоя половинка:</b>\n\n';
  let globalIndex = 1;

  for (const [cat, items] of Object.entries(grouped)) {
    message += `<b>${CATEGORY_NAMES[cat] || cat}</b>\n`;
    items.forEach((note) => {
      message += `${globalIndex}. ${note.text}\n`;
      globalIndex++;
    });
    message += '\n';
  }

  await ctx.reply(message, { parse_mode: 'HTML' });
}

export async function handleCompliment(ctx: BotContext) {
  const telegramId = ctx.from!.id;
  const compliment = ComplimentService.getRandomCompliment();
  KV.set(`pending_compliment_${telegramId}`, compliment);

  const text = `🎭 Порадуй любимого человека прямо сейчас!\n\n` +
               `💡 Предлагаемый вариант (нажми, чтобы скопировать):\n` +
               `<code>${compliment}</code>`;

  await ctx.reply(text, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Отправить', 'send_compliment')],
      [Markup.button.callback('🔄 Выдать новый вариант', 'new_compliment')]
    ])
  });
}