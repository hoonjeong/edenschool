import pool from '../db';
import type { LectureProgress, LectureProgressWithStudent } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// 진도 조회 (학생)
export async function selectLectureProgress(userId: number, lectureId: number): Promise<LectureProgress | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id as userId, lecture_id as lectureId, watched_seconds as watchedSeconds, duration, percent, completed, updated_at as updatedAt FROM lecture_progress WHERE user_id=? AND lecture_id=?`,
    [userId, lectureId]
  );
  return (rows[0] as LectureProgress) || null;
}

// 진도 저장/갱신 (학생)
export async function upsertLectureProgress(
  userId: number,
  lectureId: number,
  watchedSeconds: number,
  duration: number,
  percent: number,
  completed: number
): Promise<void> {
  await pool.query<ResultSetHeader>(
    `INSERT INTO lecture_progress (user_id, lecture_id, watched_seconds, duration, percent, completed) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE watched_seconds=GREATEST(watched_seconds, VALUES(watched_seconds)), duration=VALUES(duration), percent=GREATEST(percent, VALUES(percent)), completed=GREATEST(completed, VALUES(completed))`,
    [userId, lectureId, watchedSeconds, duration, percent, completed]
  );
}

// 강의별 시청 학생 목록 (관리자)
export async function selectLectureProgressByLectureId(lectureId: number): Promise<LectureProgressWithStudent[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT lp.id, lp.user_id as userId, lp.lecture_id as lectureId, lp.watched_seconds as watchedSeconds, lp.duration, lp.percent, lp.completed, lp.updated_at as updatedAt, s.name as studentName, s.school, s.grade FROM lecture_progress lp JOIN user_info u ON lp.user_id=u.id JOIN student s ON u.student_id=s.id WHERE lp.lecture_id=? ORDER BY lp.updated_at DESC`,
    [lectureId]
  );
  return rows as LectureProgressWithStudent[];
}
