import pool from '../db';
import type { Question } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ROOT + Admin: selectQuestionList
export async function selectQuestionList(lectureId: number): Promise<Question[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.text, s.name as writer, date_format(l.insert_time, "%Y-%m-%d") as date FROM question l, student s, user_info u WHERE l.lecture_id=? AND u.id=l.user_id AND s.id=u.student_id`,
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
