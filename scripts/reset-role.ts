/**
 * Сброс роли пользователя по Telegram ID.
 * Удаляет пользователя и связанные данные — при следующем /start он снова выберет роль.
 *
 * Использование: npm run reset-role -- <telegram_id>
 * Пример: npm run reset-role -- 123456789
 */
import 'dotenv/config';
import { getDb } from '../src/db/index.js';

const telegramIdRaw = process.argv[2];
if (!telegramIdRaw) {
  console.error('Укажите Telegram ID: npm run reset-role -- <telegram_id>');
  process.exit(1);
}

const telegramId = parseInt(telegramIdRaw, 10);
if (Number.isNaN(telegramId)) {
  console.error('Telegram ID должен быть числом.');
  process.exit(1);
}

const db = getDb();

const user = db.prepare('SELECT id, role FROM users WHERE telegram_id = ?').get(telegramId) as
  | { id: number; role: string }
  | undefined;

if (!user) {
  console.log(`Пользователь с telegram_id=${telegramId} не найден.`);
  process.exit(0);
}

try {
  db.exec('BEGIN');
  db.prepare('DELETE FROM pairs WHERE owner_id = ? OR partner_id = ?').run(user.id, user.id);
  db.prepare('DELETE FROM notes WHERE user_id = ?').run(user.id);
  db.prepare('DELETE FROM owner_wishes WHERE owner_id = ?').run(user.id);
  db.prepare('DELETE FROM important_dates WHERE owner_id = ?').run(user.id);
  db.prepare('DELETE FROM reminder_logs WHERE reference_id = ?').run(user.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  db.exec('COMMIT');
  console.log(`✅ Роль сброшена для telegram_id=${telegramId} (была: ${user.role}). При следующем /start пользователь снова выберет роль.`);
} catch (err) {
  db.exec('ROLLBACK');
  console.error('Ошибка при сбросе:', err);
  process.exit(1);
}
