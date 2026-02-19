import { config } from '../config.js';
import { createBot } from '../bot.js'; // We might need a singleton bot instance or pass it in
import { getNotesForOwner, getNotesByUser } from './noteService.js';
import { getDatesDueForReminderToday } from './dateService.js';
import { log } from '../logger.js';
import { KV } from './kvService.js';
import { Telegraf, Markup } from 'telegraf';
import type { BotContext } from '../types.js';
import { ComplimentService } from './complimentService.js';

// We need a way to send messages. 
// Since `createBot` returns a new instance, we should probably modify `bot.ts` to export a singleton 
// or pass the bot instance to the scheduler. 
// For now, let's assume we can create a lightweight instance just for sending, 
// OR better: Scheduler attaches to the running bot. 
// Refactoring `index.ts` to pass bot to scheduler init is best.

export class ReminderService {
  private bot: Telegraf<BotContext>;

  constructor(bot: Telegraf<BotContext>) {
    this.bot = bot;
  }

  async sendDailyCompliment(ownerId: number, targetTelegramId: number) {
    log.info(`Sending daily compliment reminder to ${targetTelegramId}`);
    
    const compliment = ComplimentService.getRandomCompliment();
    KV.set(`pending_compliment_${targetTelegramId}`, compliment);

    const text = `🔔 Напоминание: Самое время порадовать свою девушку! ✨\n\n` +
                 `💡 Предлагаемый вариант (нажми, чтобы скопировать):\n` +
                 `<code>${compliment}</code>`;
    
    try {
      await this.bot.telegram.sendMessage(targetTelegramId, text, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🚀 Отправить', 'send_compliment')],
          [Markup.button.callback('🔄 Выдать новый вариант', 'new_compliment')]
        ])
      });
    } catch (err) {
      log.error(`Failed to send compliment reminder to ${targetTelegramId}`, err);
    }
  }

  async sendWeeklyAttention(ownerId: number, targetTelegramId: number) {
    log.info(`Sending weekly attention reminder to ${targetTelegramId}`);
    const text = '🔔 Напоминание недели: Удели время качественному вниманию! \nМожет быть, маленький сюрприз или просто долгий разговор по душам? ✨';
    await this.trySend(targetTelegramId, text);
  }

  async sendBiWeeklyDate(ownerId: number, targetTelegramId: number) {
    log.info(`Sending bi-weekly date reminder to ${targetTelegramId}`);
    
    // ownerId is the DB ID of the user
    const ideas = getNotesForOwner(ownerId).filter(n => n.category === 'date_idea');
    let ideaText = '';
    if (ideas.length > 0) {
      const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
      ideaText = `\n\n💡 Идея из ваших заметок:\n"${randomIdea.text}"`;
    } else {
        ideaText = '\n\n💡 (Добавьте идеи для свиданий в бота, и я буду их подсказывать!)';
    }

    const text = `🔔 Напоминание: Пора на свидание! 🍷\nОрганизуй для неё что-то особенное на этих выходных.${ideaText}`;
    await this.trySend(targetTelegramId, text);
  }

  async sendMonthlyGift(ownerId: number, targetTelegramId: number) {
    log.info(`Sending monthly gift reminder to ${targetTelegramId}`);
    
    const gifts = getNotesForOwner(ownerId).filter(n => n.category === 'gift');
    let giftText = '';
    if (gifts.length > 0) {
        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
        giftText = `\n\n🎁 Идея из вишлиста:\n"${randomGift.text}"`;
    } else {
        giftText = '\n\n🎁 (Ваш список идей для подарков пуст, добавьте что-нибудь!)';
    }

    const text = `🔔 Напоминание месяца: Время для подарка! 🎁\nДаже мелочь может поднять настроение на весь день.${giftText}`;
    await this.trySend(targetTelegramId, text);
  }

  async checkImportantDates(ownerId: number, targetTelegramId: number) {
    const dueDates = getDatesDueForReminderToday(ownerId);
    if (dueDates.length === 0) return;

    for (const d of dueDates) {
      const text = `🔔 Приближается важное событие: <b>${d.title}</b>! (${d.date})\nОсталось совсем немного времени, чтобы подготовиться! 🎁`;
      await this.trySend(targetTelegramId, text);
    }
  }

  private async trySend(telegramId: number, text: string) {
    try {
      await this.bot.telegram.sendMessage(telegramId, text);
    } catch (err) {
      log.error(`Failed to send reminder to ${telegramId}`, err);
    }
  }
}
