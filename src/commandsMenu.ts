import type { BotContext } from './types.js';

type BotCommand = { command: string; description: string };

/** Команды в меню бота для парня (соответствуют плашкам) */
export const OWNER_COMMANDS: BotCommand[] = [
  { command: 'start', description: '🏠 Главная' },
  { command: 'help', description: '❓ Помощь' },
  { command: 'date', description: '📅 Добавить дату' },
  { command: 'dates', description: '📆 Мои даты' },
  { command: 'wishes', description: '💌 Пожелания девушки' },
  { command: 'compliment', description: '🎭 Комплимент' },
];

/** Команды в меню бота для девушки (соответствуют плашкам) */
export const PARTNER_COMMANDS: BotCommand[] = [
  { command: 'start', description: '🏠 Главная' },
  { command: 'help', description: '❓ Помощь' },
  { command: 'wish', description: '💝 Добавить пожелание' },
  { command: 'my_notes', description: '📝 Мои заметки' },
  { command: 'date', description: '📅 Добавить дату' },
  { command: 'dates', description: '📆 Мои даты' },
  { command: 'owner_wishlist', description: '📋 Вишлист парня' },
];

/** Команды по умолчанию (до выбора роли) */
export const DEFAULT_COMMANDS: BotCommand[] = [
  { command: 'start', description: '🏠 Главная' },
  { command: 'help', description: '❓ Помощь' },
];

/**
 * Устанавливает список команд в меню бота для данного чата в зависимости от роли.
 * Вызывать после определения роли (главная, выбор роли по инвайту, после выбора в сцене).
 */
export async function setCommandsForChat(ctx: BotContext, role: 'OWNER' | 'PARTNER'): Promise<void> {
  const chatId = ctx.chat?.id;
  if (chatId == null || ctx.chat?.type !== 'private') return;
  const commands = role === 'OWNER' ? OWNER_COMMANDS : PARTNER_COMMANDS;
  try {
    await ctx.telegram.setMyCommands(commands, {
      scope: { type: 'chat', chat_id: chatId },
    });
  } catch (err) {
    console.error('Failed to set commands for chat:', err);
  }
}
