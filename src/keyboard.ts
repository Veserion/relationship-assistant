import { Markup } from 'telegraf';

/** Тексты кнопок — используются для клавиатуры и обработчиков hears */
export const BTN = {
  MAIN: '🏠 Главная',
  HELP: '❓ Помощь',
  ADD_WISH: '💝 Добавить пожелание',
  MY_NOTES: '📝 Мои заметки',
  ADD_DATE: '📅 Добавить дату',
  MY_DATES: '📆 Мои даты',
  PARTNER_WISHES: '💌 От второй половинки',
  SEND_MESSAGE: '✉️ Написать',
  COMPLIMENTS: '🎭 Комплимент',
  ADD_OWNER_WISH: '📋 Добавить в вишлист',
  MY_OWNER_WISHES: '📋 Мой вишлист',
  OWNER_WISHLIST: '📋 Вишлист половинки',
  RESET_ROLE: '🔄 Сбросить роль',
} as const;

/** hasPartner = false — показать плашку «Сбросить роль» (когда пара ещё не привязана) */
export function getCommandsKeyboard(role: 'OWNER' | 'PARTNER', hasPartner: boolean = true) {
  const showResetRole = !hasPartner;
  if (role === 'OWNER') {
    const rows: string[][] = [
      [BTN.MAIN, BTN.HELP],
      [BTN.ADD_DATE, BTN.MY_DATES],
      [BTN.PARTNER_WISHES, BTN.SEND_MESSAGE],
      [BTN.ADD_OWNER_WISH, BTN.MY_OWNER_WISHES],
      [BTN.COMPLIMENTS],
    ];
    if (showResetRole) rows.push([BTN.RESET_ROLE]);
    return Markup.keyboard(rows).resize();
  }
  const rows: string[][] = [
    [BTN.MAIN, BTN.HELP],
    [BTN.ADD_WISH, BTN.MY_NOTES],
    [BTN.ADD_DATE, BTN.MY_DATES, BTN.SEND_MESSAGE],
    [BTN.OWNER_WISHLIST],
  ];
  if (showResetRole) rows.push([BTN.RESET_ROLE]);
  return Markup.keyboard(rows).resize();
}
