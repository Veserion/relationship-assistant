export const config = {
  botToken: process.env.BOT_TOKEN,
  dbConnection: process.env.DB_CONNECTION ?? './data/relationship_bot.db',
  encryptionKey: process.env.ENCRYPTION_KEY,
};
