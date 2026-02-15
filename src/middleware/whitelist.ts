import type { MiddlewareFn } from 'telegraf';
import { isWhitelisted, isOwner } from '../config.js';
import { getOrCreateOwner, getUserByTelegramId } from '../services/userService.js';
import { log } from '../logger.js';
import type { BotContext } from '../types.js';

function isWhitelistDisabled(): boolean {
  const v = String(process.env.DISABLE_WHITELIST ?? '').toLowerCase().trim();
  return ['true', '1', 'yes'].includes(v);
}

export const whitelistMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const telegramId = ctx.from?.id;
  log.debug('whitelist: telegramId=', telegramId, 'updateType=', ctx.updateType);

  if (!telegramId) {
    log.warn('whitelist: no telegramId, skipping');
    return next();
  }

  if (!isWhitelistDisabled() && !isWhitelisted(telegramId)) {
    log.warn('whitelist: rejected', telegramId);
    await ctx.reply('⛔ Доступ запрещён. Этот бот приватный.');
    return;
  }

  if (isOwner(telegramId)) {
    const user = getOrCreateOwner(telegramId);
    if (!user) {
      log.error('whitelist: getOrCreateOwner failed', { telegramId });
      await ctx.reply('⛔ Ошибка регистрации.');
      return;
    }
    ctx.state.user = user;
    log.debug('whitelist: owner set', { userId: user.id });
    return next();
  }

  const existingUser = getUserByTelegramId(telegramId);
  if (existingUser) {
    if (existingUser.role === 'OWNER' && !isOwner(telegramId)) {
      ctx.state.pendingRoleSelection = telegramId;
      log.debug('whitelist: wrong OWNER in DB, forcing role selection', { telegramId });
      return next();
    }
    ctx.state.user = existingUser;
    log.debug('whitelist: user set', { userId: existingUser.id, role: existingUser.role });
    return next();
  }

  ctx.state.pendingRoleSelection = telegramId;
  log.debug('whitelist: pendingRoleSelection', { telegramId });
  return next();
};
