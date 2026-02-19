/**
 * Выводит общее количество зарегистрированных в боте пользователей.
 *
 * Использование: npm run count-users
 */
import 'dotenv/config';
import { getDb } from '../src/db/index.js';

const db = getDb();

// Общее кол-во в таблице users
const totalRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

// Кол-во пользователей, которые состоят в парах
const linkedRow = db.prepare(`
  SELECT COUNT(DISTINCT user_id) as count FROM (
    SELECT owner_id as user_id FROM pairs
    UNION
    SELECT partner_id as user_id FROM pairs WHERE partner_id IS NOT NULL
  )
`).get() as { count: number };

const total = totalRow.count;
const inPairs = linkedRow.count;
const lonely = total - inPairs;

console.log('📊 Статистика пользователей:');
console.log(`- Всего в базе: ${total}`);
console.log(`- В связках (парах): ${inPairs}`);
console.log(`- Одиночные (без пары): ${lonely}`);
