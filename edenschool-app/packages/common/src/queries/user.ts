import pool from '../db';
import type { UserInfo, Student } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ROOT: selectUserInfoByEmail — fetch user by email (caller verifies password)
export async function selectUserInfoByEmail(email: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.email, u.pw, u.student_id as studentId, s.name, u.code FROM user_info u, student s WHERE u.email=? AND s.id=u.student_id AND u.code="S"`,
    [email]
  );
  return (rows[0] as UserInfo) || null;
}

// ROOT: checkUsedEmail
export async function checkUsedEmail(studentId: number, email: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT count(0) as cnt FROM user_info WHERE student_id!=? AND email=?`,
    [studentId, email]
  );
  return rows[0].cnt;
}

// ROOT: selectEmailByEmail
export async function selectEmailByEmail(email: string): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT email FROM user_info WHERE email=?`,
    [email]
  );
  return rows[0]?.email || null;
}

// ROOT: selectEmailByPphone / selectEmailBySphone
export async function selectEmailByPhone(phone: string, type: string): Promise<string | null> {
  const sql = type === 'P'
    ? `SELECT email FROM user_info WHERE pphone=? ORDER BY id DESC LIMIT 1`
    : `SELECT email FROM user_info WHERE sphone=? ORDER BY id DESC LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [phone]);
  return rows[0]?.email || null;
}

// ROOT: selectStudentByPhone
export async function selectStudentByPhone(sphone: string, pphone: string): Promise<Student | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM student WHERE sphone=? AND pphone=? AND status=1`,
    [sphone, pphone]
  );
  return (rows[0] as Student) || null;
}

// ROOT: insertUser — password must be pre-hashed by caller
export async function insertUser(email: string, hashedPw: string, sphone: string, pphone: string, code: string, studentId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO user_info(email, pw, sphone, pphone, code, student_id, insert_time) VALUES(?,?,?,?,?,?,now())`,
    [email, hashedPw, sphone, pphone, code, studentId]
  );
  return result.insertId;
}

// ROOT: selectUserInfoById — fetch user by id with pw hash (caller verifies password)
export async function selectUserInfoById(id: number): Promise<UserInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, pw FROM user_info WHERE id=?`,
    [id]
  );
  return (rows[0] as UserInfo) || null;
}

// ROOT: updateUserInfoPw — password must be pre-hashed by caller
export async function updateUserInfoPw(id: number, hashedPw: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE user_info SET pw=? WHERE id=?`,
    [hashedPw, id]
  );
  return result.affectedRows;
}

// ROOT: updatePassByEmail — password must be pre-hashed by caller
export async function updatePassByEmail(email: string, hashedPw: string): Promise<void> {
  await pool.query(`UPDATE user_info SET pw=? WHERE email=?`, [hashedPw, email]);
}

// ROOT: selectUserAllInfoById
export async function selectUserAllInfoById(id: number): Promise<Record<string, any> | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.name, s.grade, s.year, s.school, s.sphone, s.pphone, u.email FROM user_info u, student s WHERE u.id=? AND s.status=1 AND u.student_id=s.id`,
    [id]
  );
  return rows[0] || null;
}

// ROOT: selectUserClassInfoById
export async function selectUserClassInfoById(id: number): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT concat(ci.name, "(", ci.day, " ", ci.hour, ":", if(ci.minute="0", "00", ci.minute), ")") as class_name FROM user_info u, student s, class_status cs, class_info ci WHERE u.id=? AND s.status=1 AND cs.status=1 AND u.student_id=s.id AND cs.student_id=s.id AND ci.id=cs.class_id`,
    [id]
  );
  return rows.map((r) => r.class_name);
}

// ROOT: updateUserInfo
export async function updateUserInfo(studentId: number, email: string, sphone: string, pphone: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE student s, user_info u SET s.sphone=?, s.pphone=?, u.sphone=?, u.pphone=?, u.email=? WHERE s.id=? AND u.student_id=s.id`,
    [sphone, pphone, sphone, pphone, email, studentId]
  );
  return result.affectedRows;
}

// ROOT: selectLiveStudentByPhone
export async function selectLiveStudentByPhone(phone: string, type: string): Promise<Student | null> {
  const sql = type === 'P'
    ? `SELECT * FROM student WHERE pphone=? AND status=1 LIMIT 1`
    : `SELECT * FROM student WHERE sphone=? AND status=1 LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [phone]);
  return (rows[0] as Student) || null;
}

// Admin: updateUserInfoPwByStudentId — password must be pre-hashed by caller
export async function updateUserInfoPwByStudentId(studentId: number, hashedPw: string): Promise<void> {
  await pool.query(`UPDATE user_info SET pw=? WHERE student_id=?`, [hashedPw, studentId]);
}

// Admin: updateUserStatus
export async function updateUserStatus(studentId: number, code: string): Promise<void> {
  await pool.query(`UPDATE user_info SET code=? WHERE student_id=?`, [code, studentId]);
}
