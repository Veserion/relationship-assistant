import type { MiddlewareFn } from 'telegraf';
import type { Role } from '../types.js';
import type { BotContext } from '../types.js';

export function roleGuard(allowedRoles: Role | Role[]): MiddlewareFn<BotContext> {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return async (ctx, next) => {
    const user = ctx.state.user;
    if (!user) return next();
    if (!roles.includes(user.role)) {
      await ctx.reply('⛔ У вас нет доступа к этой команде.');
      return;
    }
    return next();
  };
}
