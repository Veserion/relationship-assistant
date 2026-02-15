import { BTN } from '../keyboard.js';
import type { BotContext } from '../types.js';
import { sendStart, sendHelp } from '../commands/global.js';
import { handleMyNotes } from '../commands/partner.js';
import { handleMyDates, handlePartnerWishes } from '../commands/owner.js';

export async function checkGlobalNavigation(ctx: BotContext, text: string): Promise<boolean> {
  const buttons = Object.values(BTN);
  if (buttons.includes(text as any)) {
    await ctx.scene.leave();

    switch (text) {
      case BTN.MAIN:
        await sendStart(ctx);
        break;
      case BTN.HELP:
        await sendHelp(ctx);
        break;
      case BTN.ADD_WISH:
        if (ctx.state.user?.role === 'PARTNER') {
          await ctx.scene.enter('ADD_WISH');
        }
        break;
      case BTN.MY_NOTES:
        if (ctx.state.user?.role === 'PARTNER') {
          await handleMyNotes(ctx);
        }
        break;
      case BTN.ADD_DATE:
        await ctx.scene.enter('ADD_DATE');
        break;
      case BTN.MY_DATES:
        if (ctx.state.user?.role === 'OWNER') {
          await handleMyDates(ctx);
        }
        break;
      case BTN.PARTNER_WISHES:
        if (ctx.state.user?.role === 'OWNER') {
          await handlePartnerWishes(ctx);
        }
        break;
      default:
        // Generic fallback if new buttons are added without handlers
        break;
    }
    return true;
  }
  return false;
}
