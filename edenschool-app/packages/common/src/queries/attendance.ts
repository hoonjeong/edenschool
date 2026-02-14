import pool from '../db';
import type { Attendance } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Admin: selectAttendanceCheckClassList
export async function selectAttendanceCheckClassList(classId: number, date: string): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT csinfo.id as student_id, csinfo.name, csinfo.school, csinfo.grade, csinfo.year, csinfo.sphone, csinfo.pphone, a.id, a.result, a.memo, csinfo.status
     FROM (SELECT s.id, s.name, s.school, s.grade, s.year, s.sphone, s.pphone, cs.class_id, cs.status FROM student s, class_status cs WHERE cs.class_id=? AND s.id=cs.student_id) as csinfo
     LEFT JOIN attendance a ON a.student_id=csinfo.id AND a.date=? AND a.class_id=?
     ORDER BY csinfo.status DESC, a.result IS NULL DESC, csinfo.name ASC`,
    [classId, date, classId]
  );
  return rows;
}

// Admin: selectStudentAttendanceInfo
export async function selectStudentAttendanceInfo(studentId: number): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.name as class_name, a.date, a.result FROM attendance a, class_info c WHERE a.student_id=? AND a.check_time > now() - INTERVAL 3 MONTH AND c.id=a.class_id ORDER BY a.id DESC`,
    [studentId]
  );
  return rows;
}

// Admin: insertAttendanceCheckClassList
export async function insertAttendanceCheckClassList(classId: number, date: string): Promise<void> {
  await pool.query(
    `INSERT INTO attendance (student_id, class_id, date, result, memo, check_time) SELECT student_id, class_id, ?, null, null, null FROM class_status WHERE class_id=? AND status=1`,
    [date, classId]
  );
}

// Admin: insertAttendanceCheckClassListAll
export async function insertAttendanceCheckClassListAll(date: string, day: string): Promise<void> {
  await pool.query(
    `INSERT INTO attendance (student_id, class_id, date, result, memo, check_time) SELECT student_id, class_id, ?, null, null, null FROM class_status cs, class_info ci WHERE cs.status=1 AND ci.day=? AND cs.class_id=ci.id`,
    [date, day]
  );
}

// Admin: updateAttendanceInfo
export async function updateAttendanceInfo(id: number, result: string, memo: string): Promise<void> {
  await pool.query(
    `UPDATE attendance SET result=?, memo=?, check_time=now() WHERE id=?`,
    [result, memo, id]
  );
}

// Admin: insertAttendanceInfo
export async function insertAttendanceInfo(studentId: number, classId: number, date: string, result: string, memo: string): Promise<void> {
  await pool.query(
    `INSERT INTO attendance (student_id, class_id, date, result, memo, check_time) VALUES (?,?,?,?,?,now())`,
    [studentId, classId, date, result, memo]
  );
}

// Admin: deleteAttendanceInfo
export async function deleteAttendanceInfo(id: number): Promise<void> {
  await pool.query(`DELETE FROM attendance WHERE id=?`, [id]);
}

// Admin: resetAttendanceInfo
export async function resetAttendanceInfo(id: number): Promise<void> {
  await pool.query(`UPDATE attendance SET result=null, memo=null, check_time=null WHERE id=?`, [id]);
}
