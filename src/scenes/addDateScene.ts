import { Scenes, Markup } from 'telegraf';
import Calendar from 'telegraf-calendar-telegram';
import { addImportantDate } from '../services/dateService.js';
import { getCommandsKeyboard } from '../keyboard.js';
import { log } from '../logger.js';
import type { BotContext, AddDateSceneSession } from '../types.js';
import { getPartner } from '../services/userService.js';

const STAGES = {
  WAITING_TITLE: 'waiting_title',
  WAITING_DATE: 'waiting_date', // Used for calendar selection
  WAITING_REMINDER_TYPE: 'waiting_reminder_type',
  WAITING_REMIND_BEFORE: 'waiting_remind_before',
} as const;

// Config for Russian calendar
const calendar = new Calendar(null as any, {
  startWeekDay: 1,
  weekDayNames: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  monthNames: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
});

export const addDateScene = new Scenes.BaseScene<BotContext>('ADD_DATE');

addDateScene.enter(async (ctx) => {
  const state = ctx.scene.state as AddDateSceneSession;
  state.stage = STAGES.WAITING_TITLE;
  state.data = {};
  await ctx.reply(
    '📅 Название события:\n<i>Годовщина, день рождения, 8 марта...</i>',
    { parse_mode: 'HTML' }
  );
});

import { checkGlobalNavigation } from './utils.js';

addDateScene.on('text', async (ctx) => {
  const text = ctx.message.text?.trim() ?? '';
  if (await checkGlobalNavigation(ctx, text)) return;

  const state = ctx.scene.state as AddDateSceneSession;

  state.data = state.data ?? {};
  const stage = state.stage ?? STAGES.WAITING_TITLE;

  if (stage === STAGES.WAITING_TITLE) {
    if (!text || text.length < 2) {
      await ctx.reply('Введите название (минимум 2 символа).');
      return;
    }
    state.data = { ...state.data, title: text };
    state.stage = STAGES.WAITING_DATE;

    await ctx.reply('📆 Выберите дату события:', calendar.getCalendar());
    return;
  }

  // Fallback if user types date instead of clicking calendar
  if (stage === STAGES.WAITING_DATE) {
     await ctx.reply('Пожалуйста, выберите дату на календаре выше ⬆️');
     return;
  }

  if (stage === STAGES.WAITING_REMIND_BEFORE) {
    const days = parseInt(text, 10);
    if (isNaN(days) || days < 0 || days > 365) {
      await ctx.reply('Введите число от 0 до 365 (дней до события).');
      return;
    }
    const { title, date, reminder_type } = state.data ?? {};
    log.debug('addDate WAITING_REMIND_BEFORE:', {
      title,
      date,
      reminder_type,
      days,
      stateUser: ctx.state.user,
      stateKeys: Object.keys(ctx.state),
    });

    if (!title || !date || !reminder_type) {
      log.warn('addDate: missing state data', state.data);
      await ctx.reply('Ошибка состояния. Начните заново — нажми «Добавить дату»');
      return ctx.scene.leave();
    }

    const currentUser = ctx.state.user;
    if (!currentUser) {
      log.error('addDate: ctx.state.user is undefined', {
        hasState: !!ctx.state,
        fromId: ctx.from?.id,
      });
      await ctx.reply('Ошибка: пользователь не найден. Нажми «Главная» и попробуй снова.');
      return ctx.scene.leave();
    }

    // Determine ownerId
    let ownerId = currentUser.id;
    if (currentUser.role === 'PARTNER') {
      // If partner adds a date, it should be assigned to the owner so reminders work
      const partner = getPartner(currentUser.id);
      if (partner && partner.role === 'OWNER') {
        ownerId = partner.id;
      } else {
        log.error('addDate: owner user not found for partner added date');
        await ctx.reply('Ошибка: не удалось определить организатора. Ваша пара полностью настроена?');
        return ctx.scene.leave();
      }
    }

    try {
      addImportantDate(ownerId, title, date, reminder_type as 'yearly' | 'once', days);
      const keyboard = getCommandsKeyboard(currentUser.role as 'OWNER' | 'PARTNER');
      await ctx.reply(
        `✅ Дата «${title}» добавлена! Напоминание за ${days} дн. до события.`,
        { reply_markup: keyboard.reply_markup }
      );
    } catch (err) {
      log.error('addDate: save failed', err);
      await ctx.reply('Не удалось сохранить дату. Попробуй ещё раз или начни заново.');
    }
    return ctx.scene.leave();
  }
});

// Calendar Actions
addDateScene.action(/calendar-telegram-date-[\d-]+/g, async (ctx) => {
  const state = ctx.scene.state as AddDateSceneSession;
  if (state.stage !== STAGES.WAITING_DATE) {
      return ctx.answerCbQuery('Сначала введите название события');
  }
  const dateStr = ctx.match[0].replace('calendar-telegram-date-', '');
  state.data = { ...state.data, date: dateStr };
  state.stage = STAGES.WAITING_REMINDER_TYPE;

  await ctx.answerCbQuery();
  // Edit the calendar message to show selected date or just remove/update it
  await ctx.editMessageText(`✅ Выбрана дата: ${dateStr}`);

  await ctx.reply('🔄 Повторять напоминание каждый год или напомнить один раз?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔄 Каждый год', callback_data: 'yearly' }],
        [{ text: '1️⃣ Один раз', callback_data: 'once' }],
      ],
    },
  });
});

addDateScene.action(/calendar-telegram-prev-[\d-]+/g, async (ctx) => {
    const dateStr = ctx.match[0].replace('calendar-telegram-prev-', '');
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() - 1);
    await ctx.answerCbQuery();
    await ctx.editMessageText('📆 Выберите дату события:', calendar.getCalendar(date));
});

addDateScene.action(/calendar-telegram-next-[\d-]+/g, async (ctx) => {
    const dateStr = ctx.match[0].replace('calendar-telegram-next-', '');
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + 1);
    await ctx.answerCbQuery();
    await ctx.editMessageText('📆 Выберите дату события:', calendar.getCalendar(date));
});

addDateScene.action(/calendar-telegram-ignore-[\d\w-]+/g, async (ctx) => {
    await ctx.answerCbQuery();
});


addDateScene.action(/^(yearly|once)$/, async (ctx) => {
  const type = ctx.match[1];
  const state = ctx.scene.state as AddDateSceneSession;
  state.data = { ...state.data, reminder_type: type };
  state.stage = STAGES.WAITING_REMIND_BEFORE;
  await ctx.answerCbQuery();
  await ctx.reply('⏰ За сколько дней напомнить до события?\n<i>Введите число от 0 до 365</i>', { parse_mode: 'HTML' });
});

addDateScene.on('message', async (ctx) => {
  await ctx.reply('Пожалуйста, отправьте текстовое сообщение или используйте кнопки.');
});
