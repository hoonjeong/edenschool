import pool from '../db';
import type { Question } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ROOT: selectQuestionList (학생용 — 질문 + 답변 표시)
export async function selectQuestionList(lectureId: number): Promise<Question[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.id, l.text, s.name as writer, date_format(l.insert_time, "%Y-%m-%d") as date,
            l.answer, l.answer_by as answerBy, date_format(l.answer_time, "%Y-%m-%d") as answerDate
     FROM question l, student s, user_info u
     WHERE l.lecture_id=? AND u.id=l.user_id AND s.id=u.student_id
     ORDER BY l.id`,
    [lectureId]
  );
  return rows as Question[];
}

// Admin: selectQuestionListAdmin (관리자용 — 답변 작성 화면. 질문 id 포함)
export async function selectQuestionListAdmin(lectureId: number): Promise<Question[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.id, l.text, l.user_id as userId, s.name as writer, date_format(l.insert_time, "%Y-%m-%d") as date,
            l.answer, l.answer_by as answerBy, date_format(l.answer_time, "%Y-%m-%d") as answerDate
     FROM question l, student s, user_info u
     WHERE l.lecture_id=? AND u.id=l.user_id AND s.id=u.student_id
     ORDER BY l.id`,
    [lectureId]
  );
  return rows as Question[];
}

// ROOT: insertQuestion
export async function insertQuestion(text: string, userId: number, lectureId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO question (text, user_id, lecture_id, insert_time) VALUES (?,?,?,now())`,
    [text, userId, lectureId]
  );
  return result.insertId;
}

// Admin: answerQuestion (질문에 답변 저장/수정)
export async function answerQuestion(questionId: number, answer: string, answerBy: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE question SET answer=?, answer_by=?, answer_time=now() WHERE id=?`,
    [answer, answerBy, questionId]
  );
  return result.affectedRows;
}
