import pool from '../db';
import type { MyDream } from '../types';
import type { RowDataPacket } from 'mysql2';

// ROOT: selectMyDreamByUserId
export async function selectMyDreamByUserId(userId: number): Promise<MyDream[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, id1, id2, type FROM my_dream WHERE user_id=? ORDER BY type ASC, id ASC`,
    [userId]
  );
  return rows as MyDream[];
}

// ROOT: checkMyDream
export async function checkMyDream(userId: number, id1: string, id2: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT count(0) as cnt FROM my_dream WHERE user_id=? AND id1=? AND id2=?`,
    [userId, id1, id2]
  );
  return rows[0].cnt > 0;
}

// ROOT: insertDream
export async function insertDream(userId: number, name: string, id1: string, id2: string, type: string): Promise<void> {
  await pool.query(
    `INSERT INTO my_dream (user_id, name, id1, id2, type, insert_time) VALUES (?,?,?,?,?,now())`,
    [userId, name, id1, id2, type]
  );
}

// ROOT: selectDreamById
export async function selectDreamById(id: number): Promise<{ id: number; userId: number } | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id as userId FROM my_dream WHERE id=?`,
    [id]
  );
  return (rows[0] as { id: number; userId: number }) || null;
}

// ROOT: deleteDream
export async function deleteDream(id: number): Promise<void> {
  await pool.query(`DELETE FROM my_dream WHERE id=?`, [id]);
}
