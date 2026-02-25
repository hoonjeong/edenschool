import pool from '../db';
import type { ClassInfo, ClassStatus } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ROOT: selectSchoolLectureList
export async function selectSchoolLectureList(): Promise<ClassInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, day, hour, minute, teacherOne, teacherTwo FROM class_info WHERE code="S" AND liveStatus=1 ORDER BY name ASC`
  );
  return rows as ClassInfo[];
}

/** 학생이 해당 반에 수강 등록되어 있는지 확인 */
export async function isStudentEnrolledInClass(studentId: number, classId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM class_status WHERE student_id=? AND class_id=? AND status=1 LIMIT 1`,
    [studentId, classId]
  );
  return rows.length > 0;
}

// Admin: selectClassInfoAll
export async function selectClassInfoAll(): Promise<ClassInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.name, c.grade, c.year, c.day, c.hour, c.minute, c.teacherOne, c.teacherTwo, c.liveStatus, (SELECT count(0) FROM class_status WHERE class_id=c.id AND status=1) as liveCount FROM class_info c ORDER BY liveStatus DESC, name ASC`
  );
  return rows as ClassInfo[];
}

// Admin: selectClassInfoListLive
export async function selectClassInfoListLive(): Promise<ClassInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM class_info WHERE liveStatus=1 ORDER BY hour ASC, minute ASC`
  );
  return rows as ClassInfo[];
}

// Admin: selectClassInfoLive
export async function selectClassInfoLive(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT name FROM class_info WHERE liveStatus=1`
  );
  return rows.map((r) => r.name);
}

// Admin: selectClassinfoById
export async function selectClassInfoById(id: number): Promise<ClassInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM class_info WHERE id=?`,
    [id]
  );
  return (rows[0] as ClassInfo) || null;
}

// Admin: insertClassInfo
export async function insertClassInfo(info: Omit<ClassInfo, 'id' | 'limitCount' | 'liveStatus'>): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO class_info (name, subject, grade, year, day, hour, minute, teacherOne, teacherTwo, code, price, limitCount, liveStatus) VALUES(?,?,?,?,?,?,?,?,?,?,?,30,1)`,
    [info.name, info.subject, info.grade, info.year, info.day, info.hour, info.minute, info.teacherOne, info.teacherTwo, info.code, info.price]
  );
  return result.insertId;
}

// Admin: deleteClass
export async function deleteClass(id: number): Promise<void> {
  await pool.query(`DELETE FROM class_info WHERE id=?`, [id]);
}

// Admin: endClass
export async function endClass(id: number): Promise<void> {
  await pool.query(`UPDATE class_info SET liveStatus=0 WHERE id=?`, [id]);
}

// Admin: restartClass
export async function restartClass(id: number): Promise<void> {
  await pool.query(`UPDATE class_info SET liveStatus=1 WHERE id=?`, [id]);
}

// Admin: selectClassIdByName
export async function selectClassIdByName(name: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM class_info WHERE name=?`,
    [name]
  );
  return rows[0]?.id || -1;
}

// Admin: selectClassInfoByStudentId
export async function selectClassInfoByStudentId(studentId: number): Promise<ClassStatus[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cs.id, cs.student_id as studentId, cs.class_id as classId, ci.name as className, cs.status, date_format(cs.start_time,"%Y-%m-%d") as startTime, date_format(cs.end_time,"%Y-%m-%d") as endTime FROM class_status cs, class_info ci WHERE cs.student_id=? AND ci.id=cs.class_id ORDER BY status DESC, class_id DESC`,
    [studentId]
  );
  return rows as ClassStatus[];
}

// Admin: insertClassStatus
export async function insertClassStatus(classId: number, studentId: number, startTime: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO class_status (class_id, student_id, start_time, status) VALUES (?,?,?,1)`,
    [classId, studentId, startTime]
  );
  return result.insertId;
}

// Admin: updateClassStatus
export async function updateClassStatus(id: number, status: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE class_status SET status=?, end_time=now() WHERE id=?`,
    [status, id]
  );
  return result.affectedRows;
}

// Admin: restartClassStatus
export async function restartClassStatus(id: number, status: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE class_status SET status=?, end_time=null WHERE id=?`,
    [status, id]
  );
  return result.affectedRows;
}

// Admin: deleteClassStatusById
export async function deleteClassStatusById(id: number): Promise<void> {
  await pool.query(`DELETE FROM class_status WHERE id=?`, [id]);
}

// Admin: endClassStatus
export async function endClassStatus(studentId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE class_status SET end_time=now(), status=0 WHERE student_id=?`,
    [studentId]
  );
  return result.affectedRows;
}

// Admin: selectTeacherClassListByTeacherName
export async function selectTeacherClassListByTeacherName(name: string): Promise<ClassInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, day, hour, minute, teacherOne, teacherTwo, (SELECT count(0) FROM class_status WHERE class_id=c.id AND status=1) as liveCount FROM class_info c WHERE (c.teacherOne=? OR c.teacherTwo=?) AND liveStatus=1 ORDER BY code ASC, name ASC`,
    [name, name]
  );
  return rows as ClassInfo[];
}

// Admin: selectMonthlyNewStudentsByTeacher - 이번달 신입생 (담당반 기준)
export async function selectMonthlyNewStudentsByTeacher(teacherName: string): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.name as studentName, ci.name as className, date_format(cs.start_time, '%Y-%m-%d') as startDate
     FROM class_status cs
     JOIN class_info ci ON cs.class_id = ci.id
     JOIN student s ON cs.student_id = s.id
     WHERE (ci.teacherOne=? OR ci.teacherTwo=?)
       AND ci.liveStatus=1
       AND cs.start_time >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
       AND cs.status=1
     ORDER BY cs.start_time DESC`,
    [teacherName, teacherName]
  );
  return rows;
}

// Admin: selectMonthlyExitStudentsByTeacher - 이번달 퇴원생 (담당반 기준)
export async function selectMonthlyExitStudentsByTeacher(teacherName: string): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.name as studentName, ci.name as className, date_format(cs.end_time, '%Y-%m-%d') as endDate
     FROM class_status cs
     JOIN class_info ci ON cs.class_id = ci.id
     JOIN student s ON cs.student_id = s.id
     WHERE (ci.teacherOne=? OR ci.teacherTwo=?)
       AND ci.liveStatus=1
       AND cs.end_time >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
       AND cs.status=0
     ORDER BY cs.end_time DESC`,
    [teacherName, teacherName]
  );
  return rows;
}

// Admin: selectTeacherClassTestListByTeacherName
export async function selectTeacherClassTestListByTeacherName(name: string): Promise<ClassInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, teacherOne, teacherTwo, (SELECT count(0) FROM test_plan WHERE class_id=c.id) as testCount FROM class_info c WHERE (c.teacherOne=? OR c.teacherTwo=?) AND liveStatus=1 ORDER BY code ASC, name ASC`,
    [name, name]
  );
  return rows as ClassInfo[];
}
