import { BTN } from '../keyboard.js';
import type { BotContext } from '../types.js';
import { sendStart, sendHelp } from '../commands/global.js';
import { handleMyNotes, handleOwnerWishlistForPartner } from '../commands/partner.js';
import { handleDatesForPair, handlePartnerWishes, handleMyOwnerWishes } from '../commands/owner.js';

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
      case BTN.OWNER_WISHLIST:
        if (ctx.state.user?.role === 'PARTNER') {
          await handleOwnerWishlistForPartner(ctx);
        }
        break;
      case BTN.SEND_MESSAGE:
        await ctx.scene.enter('SEND_MESSAGE');
        break;
      case BTN.ADD_DATE:
        await ctx.scene.enter('ADD_DATE');
        break;
      case BTN.MY_DATES:
        if (ctx.state.user) {
          await handleDatesForPair(ctx);
        }
        break;
      case BTN.PARTNER_WISHES:
        if (ctx.state.user?.role === 'OWNER') {
          await handlePartnerWishes(ctx);
        }
        break;
      case BTN.ADD_OWNER_WISH:
        if (ctx.state.user?.role === 'OWNER') {
          await ctx.scene.enter('ADD_OWNER_WISH');
        }
        break;
      case BTN.MY_OWNER_WISHES:
        if (ctx.state.user?.role === 'OWNER') {
          await handleMyOwnerWishes(ctx);
        }
        break;
      case BTN.RESET_ROLE:
        await ctx.scene.enter('SELECT_ROLE');
        break;
      default:
        // Generic fallback if new buttons are added without handlers
        break;
    }
    return true;
  }
  return false;
}
