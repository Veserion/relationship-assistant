/**
 * Удаление пары из БД по Telegram ID одного из участников.
 * Удаляются оба пользователя пары и все связанные с ними данные.
 *
 * Использование: npm run delete-pair -- <telegram_id>
 * Пример: npm run delete-pair -- 123456789
 */
import 'dotenv/config';
import { getDb } from '../src/db/index.js';

const telegramIdRaw = process.argv[2];
if (!telegramIdRaw) {
  console.error('Укажите Telegram ID одного из участников пары: npm run delete-pair -- <telegram_id>');
  process.exit(1);
}

const telegramId = parseInt(telegramIdRaw, 10);
if (Number.isNaN(telegramId)) {
  console.error('Telegram ID должен быть числом.');
  process.exit(1);
}

const db = getDb();

const userA = db.prepare('SELECT id, telegram_id, role FROM users WHERE telegram_id = ?').get(telegramId) as
  | { id: number; telegram_id: number; role: string }
  | undefined;

if (!userA) {
  console.log(`Пользователь с telegram_id=${telegramId} не найден.`);
  process.exit(0);
}

const pair = db.prepare('SELECT owner_id, partner_id FROM pairs WHERE owner_id = ? OR partner_id = ?').get(
  userA.id,
  userA.id
) as { owner_id: number; partner_id: number } | undefined;

if (!pair) {
  console.log(`У пользователя telegram_id=${telegramId} нет привязанной пары.`);
  process.exit(0);
}

const idB = pair.owner_id === userA.id ? pair.partner_id : pair.owner_id;
const userB = db.prepare('SELECT id, telegram_id, role FROM users WHERE id = ?').get(idB) as
  | { id: number; telegram_id: number; role: string }
  | undefined;

if (!userB) {
  console.log('Второй участник пары не найден в users.');
  process.exit(1);
}

const idA = userA.id;
const idBVal = userB.id;

try {
  db.exec('BEGIN');
  db.prepare('DELETE FROM pairs WHERE owner_id = ? OR partner_id = ?').run(idA, idA);
  db.prepare('DELETE FROM notes WHERE user_id = ? OR user_id = ?').run(idA, idBVal);
  db.prepare('DELETE FROM owner_wishes WHERE owner_id = ? OR owner_id = ?').run(idA, idBVal);
  db.prepare('DELETE FROM important_dates WHERE owner_id = ? OR owner_id = ?').run(idA, idBVal);
  db.prepare('DELETE FROM reminder_logs WHERE reference_id = ? OR reference_id = ?').run(idA, idBVal);
  db.prepare('DELETE FROM users WHERE id = ? OR id = ?').run(idA, idBVal);
  db.exec('COMMIT');
  console.log(
    `✅ Пара удалена. Удалены оба участника:\n` +
      `   • telegram_id=${userA.telegram_id} (${userA.role})\n` +
      `   • telegram_id=${userB.telegram_id} (${userB.role})`
  );
} catch (err) {
  db.exec('ROLLBACK');
  console.error('Ошибка при удалении пары:', err);
  process.exit(1);
}
