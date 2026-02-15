import type { Telegraf } from 'telegraf';
import { roleGuard } from '../middleware/roleGuard.js';
import { getDatesByOwner } from '../services/dateService.js';
import { getNotesForOwner } from '../services/noteService.js';
import { BTN } from '../keyboard.js';
import type { BotContext } from '../types.js';

const ownerGuard = roleGuard('OWNER');

export function registerOwnerCommands(bot: Telegraf<BotContext>): void {
  bot.command('date', ownerGuard, (ctx) => ctx.scene.enter('ADD_DATE'));
  bot.hears(BTN.ADD_DATE, ownerGuard, (ctx) => ctx.scene.enter('ADD_DATE'));

  bot.command('dates', ownerGuard, handleMyDates);
  bot.hears(BTN.MY_DATES, ownerGuard, handleMyDates);

  bot.command('wishes', ownerGuard, handlePartnerWishes);
  bot.hears(BTN.PARTNER_WISHES, ownerGuard, handlePartnerWishes);
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
  const notes = getNotesForOwner(user.id);
  if (!notes.length) {
    await ctx.reply('Пока твоя половинка ничего не добавила 💌');
    return;
  }
  const list = notes
    .slice(0, 20)
    .map((n, i) => `${i + 1}. ${n.text}`)
    .join('\n\n');
  await ctx.reply(`💝 Что хочет твоя половинка:\n\n${list}`);
}