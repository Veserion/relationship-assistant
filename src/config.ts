export const config = {
  botToken: process.env.BOT_TOKEN,
  ownerId: parseInt(process.env.OWNER_ID ?? '', 10),
  partnerId: parseInt(process.env.PARTNER_ID ?? '', 10),
  dbConnection: process.env.DB_CONNECTION ?? './data/relationship_bot.db',
  /** При true whitelist отключён — любой пользователь получает роль OWNER (для разработки) */
  disableWhitelist: ['true', '1', 'yes'].includes(
    String(process.env.DISABLE_WHITELIST ?? '').toLowerCase().trim()
  ),
};

const whitelist = [config.ownerId, config.partnerId].filter((id) => !isNaN(id));

export function getWhitelist(): number[] {
  return whitelist;
}

export function isWhitelisted(telegramId: number | string): boolean {
  if (config.disableWhitelist) return true;
  return whitelist.includes(parseInt(String(telegramId), 10));
}

export function isOwner(telegramId: number | string): boolean {
  return parseInt(String(telegramId), 10) === config.ownerId;
}

export function resolveRole(telegramId: number | string): 'OWNER' | 'PARTNER' | null {
  const id = parseInt(String(telegramId), 10);
  if (id === config.ownerId) return 'OWNER';
  if (!config.disableWhitelist && id === config.partnerId) return 'PARTNER';
  return null;
}

/** Нужен ли выбор роли при старте (для не-owner) */
export function needsRoleSelection(telegramId: number | string): boolean {
  if (isOwner(telegramId)) return false;
  return true;
}

function isWhitelistDisabled(): boolean {
  const v = String(process.env.DISABLE_WHITELIST ?? '').toLowerCase().trim();
  return ['true', '1', 'yes'].includes(v);
}
