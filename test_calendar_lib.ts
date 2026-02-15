import Calendar from 'telegraf-calendar-telegram';
import { Telegraf } from 'telegraf';

// Mock Telegraf to check type compatibility (static check via compilation if we were running tsc)
// In this script we just check if it imports and instantiates without runtime errors.

console.log('Testing telegraf-calendar-telegram import...');

try {
  // @ts-ignore - ignore potential type mismatch for this quick check
  const calendar = new Calendar(new Telegraf('TOKEN'), {
     startWeekDay: 1,
     weekDayNames: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
     monthNames: [
         "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
         "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
     ]
  });
  console.log('Calendar instantiated successfully');
  console.log('Calendar methods available:', Object.keys(calendar));
} catch (error) {
  console.error('Failed to instantiate calendar:', error);
}
