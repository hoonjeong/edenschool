import pool from '../db';
import type { StudentMemo } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ============================================================
// 학생 메모
// ============================================================

// 메모 목록 (최신순)
export async function selectStudentMemos(studentId: number): Promise<StudentMemo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, student_id AS studentId, content,
            date_format(insert_time, '%Y-%m-%d %H:%i') AS date
       FROM student_memo
      WHERE student_id=?
      ORDER BY insert_time DESC, id DESC`,
    [studentId]
  );
  return rows as StudentMemo[];
}

// 메모 추가
export async function insertStudentMemo(studentId: number, content: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO student_memo (student_id, content, insert_time) VALUES (?,?,now())`,
    [studentId, content]
  );
  return result.insertId;
}

// 메모 삭제
export async function deleteStudentMemo(id: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM student_memo WHERE id=?`,
    [id]
  );
  return result.affectedRows;
}
