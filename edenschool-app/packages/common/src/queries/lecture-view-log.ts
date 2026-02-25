import pool from '../db';
import type { LectureViewLogWithStudent } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// 시청 로그 생성 (학생)
export async function insertLectureViewLog(
  userId: number,
  lectureId: number,
  ip: string,
  deviceType: string,
  userAgent: string,
  startSeconds: number
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO lecture_view_log (user_id, lecture_id, ip, device_type, user_agent, start_time, start_seconds) VALUES (?,?,?,?,?,NOW(),?)`,
    [userId, lectureId, ip, deviceType, userAgent.substring(0, 512), startSeconds]
  );
  return result.insertId;
}

// 시청 로그 업데이트 (학생)
export async function updateLectureViewLog(
  id: number,
  userId: number,
  endSeconds: number,
  duration: number
): Promise<void> {
  await pool.query<ResultSetHeader>(
    `UPDATE lecture_view_log SET end_time=NOW(), end_seconds=?, duration=? WHERE id=? AND user_id=?`,
    [endSeconds, duration, id, userId]
  );
}

// 관리자: 강의별 시청 로그 조회
export async function selectLectureViewLogsByLectureId(lectureId: number): Promise<LectureViewLogWithStudent[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT v.id, v.user_id as userId, v.lecture_id as lectureId, v.ip, v.device_type as deviceType, v.start_time as startTime, v.end_time as endTime, v.start_seconds as startSeconds, v.end_seconds as endSeconds, v.duration, s.name as studentName, s.school, s.grade, l.subject as lectureSubject FROM lecture_view_log v JOIN user_info u ON v.user_id=u.id JOIN student s ON u.student_id=s.id LEFT JOIN lecture l ON v.lecture_id=l.id WHERE v.lecture_id=? ORDER BY v.start_time DESC LIMIT 1000`,
    [lectureId]
  );
  return rows as LectureViewLogWithStudent[];
}

// 관리자: 최근 시청 로그 조회
export async function selectLectureViewLogs(limit: number = 200): Promise<LectureViewLogWithStudent[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT v.id, v.user_id as userId, v.lecture_id as lectureId, v.ip, v.device_type as deviceType, v.start_time as startTime, v.end_time as endTime, v.start_seconds as startSeconds, v.end_seconds as endSeconds, v.duration, s.name as studentName, s.school, s.grade, l.subject as lectureSubject FROM lecture_view_log v JOIN user_info u ON v.user_id=u.id JOIN student s ON u.student_id=s.id LEFT JOIN lecture l ON v.lecture_id=l.id ORDER BY v.start_time DESC LIMIT ?`,
    [limit]
  );
  return rows as LectureViewLogWithStudent[];
}

// 관리자: 날짜 범위로 시청 로그 조회
export async function selectLectureViewLogsByDate(startDate: string, endDate: string): Promise<LectureViewLogWithStudent[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT v.id, v.user_id as userId, v.lecture_id as lectureId, v.ip, v.device_type as deviceType, v.start_time as startTime, v.end_time as endTime, v.start_seconds as startSeconds, v.end_seconds as endSeconds, v.duration, s.name as studentName, s.school, s.grade, l.subject as lectureSubject FROM lecture_view_log v JOIN user_info u ON v.user_id=u.id JOIN student s ON u.student_id=s.id LEFT JOIN lecture l ON v.lecture_id=l.id WHERE v.start_time BETWEEN ? AND ? ORDER BY v.start_time DESC LIMIT 5000`,
    [startDate, endDate + ' 23:59:59']
  );
  return rows as LectureViewLogWithStudent[];
}
