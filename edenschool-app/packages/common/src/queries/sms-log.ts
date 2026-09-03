import pool from '../db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Admin: 특정 번호의 발송 이력 (발송자 무관 전체, 최근순). 번호는 대시 유무 무관하게 매칭.
export async function selectSendHistoryByPhone(phone: string, limit: number = 30): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT phone, message, type, result_message, date_format(send_time, '%Y-%m-%d %H:%i') as send_time
     FROM sms_send_result_renew
     WHERE REPLACE(phone,'-','')=REPLACE(?,'-','')
     ORDER BY id DESC LIMIT ?`,
    [phone, limit]
  );
  return rows;
}

// Admin: selectPhoneByClassIds
export async function selectPhoneByClassIds(classIds: number[]): Promise<Record<string, any>[]> {
  if (classIds.length === 0) return [];
  const placeholders = classIds.map(() => '?').join(',');
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ci.name as className, s.name as studentName, s.sphone, s.pphone FROM student s, class_status cs, class_info ci WHERE ci.id IN (${placeholders}) AND cs.status=1 AND s.status=1 AND cs.class_id=ci.id AND s.id=cs.student_id ORDER BY className ASC, studentName ASC`,
    classIds
  );
  return rows;
}

// Admin: selectMemoByTeacherId
export async function selectMemoByTeacherId(id: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT memo FROM sms_memo WHERE teacher_id=?`,
    [id]
  );
  return rows[0]?.memo || null;
}

// Admin: insertMemo
export async function insertMemo(teacherId: number, memo: string): Promise<void> {
  await pool.query(
    `INSERT INTO sms_memo (memo, teacher_id, insert_time, update_time) VALUES (?,?,now(),now())`,
    [memo, teacherId]
  );
}

// Admin: updateMemoByTeacherId
export async function updateMemoByTeacherId(teacherId: number, memo: string): Promise<void> {
  await pool.query(
    `UPDATE sms_memo SET memo=?, update_time=now() WHERE teacher_id=?`,
    [memo, teacherId]
  );
}

// Template CRUD
export async function selectTemplatesByTeacherId(teacherId: number): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, title, content, date_format(insert_time, '%Y-%m-%d %H:%i') as created_at FROM sms_template WHERE teacher_id=? ORDER BY update_time DESC`,
    [teacherId]
  );
  return rows;
}

export async function insertTemplate(teacherId: number, title: string, content: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO sms_template (teacher_id, title, content, insert_time, update_time) VALUES (?,?,?,now(),now())`,
    [teacherId, title, content]
  );
  return result.insertId;
}

export async function deleteTemplate(id: number, teacherId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM sms_template WHERE id=? AND teacher_id=?`,
    [id, teacherId]
  );
  return result.affectedRows;
}

// sms_send_result_renew: 최근 발송 이력 (발송자 무관 전체)
export async function selectRecentSendHistory(limit: number = 20): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT phone, message, type, result_message, date_format(send_time, '%Y-%m-%d %H:%i') as send_time FROM sms_send_result_renew ORDER BY id DESC LIMIT ?`,
    [limit]
  );
  return rows;
}
