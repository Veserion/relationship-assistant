import type { MiddlewareFn } from 'telegraf';
import { getUserByTelegramId } from '../services/userService.js';
import type { BotContext } from '../types.js';

function isWhitelistDisabled(): boolean {
  const v = String(process.env.DISABLE_WHITELIST ?? '').toLowerCase().trim();
  return ['true', '1', 'yes'].includes(v);
}

export const whitelistMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return next();

  const user = getUserByTelegramId(telegramId);
  if (user) {
    ctx.state.user = user;
    return next();
  }

  // If new user, they will stay in bot.use(async (ctx, next) => ... if (ctx.state.pendingRoleSelection) ...)
  ctx.state.pendingRoleSelection = telegramId;
  return next();
};
