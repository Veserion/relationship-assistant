declare module 'telegraf-calendar-telegram' {
  import { Context, Telegraf } from 'telegraf';

  interface CalendarOptions {
    startWeekDay?: number;
    weekDayNames?: string[];
    monthNames?: string[];
    minDate?: Date;
    maxDate?: Date;
  }

  export default class Calendar {
    constructor(bot: Telegraf<any> | null, options?: CalendarOptions);
    getCalendar(date?: Date): any;
    setDateListener(onDateSelected: (context: Context, date: string) => void): void;
    setMinDate(date: Date): Calendar;
    setMaxDate(date: Date): Calendar;
    setWeekDayNames(names: string[]): Calendar;
    setMonthNames(names: string[]): Calendar;
    setStartWeekDay(startDay: number): Calendar;
  }
}
