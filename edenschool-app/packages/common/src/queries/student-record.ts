import pool from '../db';
import type { StudentMemo, StudentScore } from '../types';
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

// ============================================================
// 학생 성적 (내신 / 모의고사 공용, category로 구분)
// ============================================================

// 성적 목록 (기록순 - 추이 그래프가 시간순으로 나오도록 오름차순)
export async function selectStudentScores(
  studentId: number,
  category: 'naesin' | 'mock'
): Promise<StudentScore[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, student_id AS studentId, category, test_name AS testName,
            raw_score AS rawScore, grade_rank AS gradeRank, memo,
            date_format(insert_time, '%Y-%m-%d') AS date
       FROM student_score
      WHERE student_id=? AND category=?
      ORDER BY insert_time ASC, id ASC`,
    [studentId, category]
  );
  return rows as StudentScore[];
}

// 성적 추가
export async function insertStudentScore(
  studentId: number,
  category: 'naesin' | 'mock',
  testName: string,
  rawScore: number | null,
  gradeRank: number | null,
  memo: string
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO student_score (student_id, category, test_name, raw_score, grade_rank, memo, insert_time)
     VALUES (?,?,?,?,?,?,now())`,
    [studentId, category, testName, rawScore, gradeRank, memo]
  );
  return result.insertId;
}

// 성적 수정
export async function updateStudentScore(
  id: number,
  testName: string,
  rawScore: number | null,
  gradeRank: number | null,
  memo: string
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE student_score SET test_name=?, raw_score=?, grade_rank=?, memo=? WHERE id=?`,
    [testName, rawScore, gradeRank, memo, id]
  );
  return result.affectedRows;
}

// 성적 삭제
export async function deleteStudentScore(id: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM student_score WHERE id=?`,
    [id]
  );
  return result.affectedRows;
}
