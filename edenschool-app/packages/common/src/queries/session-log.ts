import pool from '../db';
import type { ResultSetHeader } from 'mysql2';

// 세션 하트비트 UPSERT
export async function upsertSessionLog(userId: number, ip: string, userAgent: string): Promise<void> {
  await pool.query<ResultSetHeader>(
    `INSERT INTO session_log (user_id, ip, user_agent, last_active) VALUES (?,?,?,NOW()) ON DUPLICATE KEY UPDATE last_active=NOW()`,
    [userId, ip, userAgent.substring(0, 512)]
  );
}

// 오래된 세션 로그 정리 (24시간 초과)
export async function deleteOldSessionLogs(): Promise<void> {
  await pool.query(`DELETE FROM session_log WHERE last_active < DATE_SUB(NOW(), INTERVAL 24 HOUR)`);
}
