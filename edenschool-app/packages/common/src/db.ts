import mysql from 'mysql2/promise';
import type { PoolConnection } from 'mysql2/promise';

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error('Database configuration missing. Set DB_HOST, DB_USER, and DB_PASSWORD environment variables.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'edenschool',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: 'utf8',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 20,
  queueLimit: 0,
});

export default pool;

export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
