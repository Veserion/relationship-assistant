import { getDb } from '../db/index.js';
import type { OwnerWish } from '../types.js';
import { encrypt, decrypt } from './encryptionService.js';

export function addOwnerWish(ownerId: number, text: string): number {
  const db = getDb();
  const encryptedText = encrypt(text);
  const result = db.prepare(
    'INSERT INTO owner_wishes (owner_id, text) VALUES (?, ?)'
  ).run(ownerId, encryptedText);
  return result.lastInsertRowid as number;
}

export function getOwnerWishes(ownerId: number, limit: number = 100): OwnerWish[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM owner_wishes WHERE owner_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(ownerId, limit) as (OwnerWish & { text: string })[];
  return rows.map((r) => ({ ...r, text: decrypt(r.text) }));
}

export function getOwnerWishById(id: number): OwnerWish | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM owner_wishes WHERE id = ?').get(id) as (OwnerWish & { text: string }) | undefined;
  if (!row) return undefined;
  return { ...row, text: decrypt(row.text) };
}

export function updateOwnerWish(id: number, ownerId: number, text: string): boolean {
  const db = getDb();
  const result = db.prepare(
    'UPDATE owner_wishes SET text = ? WHERE id = ? AND owner_id = ?'
  ).run(encrypt(text), id, ownerId);
  return result.changes > 0;
}

export function deleteOwnerWish(id: number, ownerId: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM owner_wishes WHERE id = ? AND owner_id = ?').run(id, ownerId);
  return result.changes > 0;
}
