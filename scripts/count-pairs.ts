/**
 * Выводит количество зарегистрированных в боте пар.
 *
 * Использование: npm run count-pairs
 */
import 'dotenv/config';
import { getDb } from '../src/db/index.js';

const db = getDb();
const row = db.prepare('SELECT COUNT(*) as count FROM pairs').get() as { count: number };
console.log(`Зарегистрировано пар: ${row.count}`);
