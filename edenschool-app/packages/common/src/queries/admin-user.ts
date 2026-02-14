import pool from '../db';
import type { AdminUserInfo } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Admin: selectAdminUserInfoByEmail — fetch by email with pw (caller verifies password)
export async function selectAdminUserInfoByEmail(email: string): Promise<AdminUserInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, pw, phone, code FROM admin_user_info WHERE email=?`,
    [email]
  );
  return (rows[0] as AdminUserInfo) || null;
}

// Admin: selectAdminUserInfoByLoginInput — original SQL SHA1 login (legacy)
export async function selectAdminUserInfoByLoginInput(email: string, pw: string): Promise<AdminUserInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, phone, code FROM admin_user_info WHERE email=? AND pw=SHA1(?)`,
    [email, pw]
  );
  return (rows[0] as AdminUserInfo) || null;
}

// Admin: selectAdminUserInfoById
export async function selectAdminUserInfoById(id: number): Promise<AdminUserInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT name, email, phone FROM admin_user_info WHERE id=?`,
    [id]
  );
  return (rows[0] as AdminUserInfo) || null;
}

// Admin: selectAdminUserInfoByName
export async function selectAdminUserInfoByName(name: string): Promise<AdminUserInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, phone, code FROM admin_user_info WHERE name=?`,
    [name]
  );
  return (rows[0] as AdminUserInfo) || null;
}

// Admin: selectAdminUserPwById — fetch pw hash by id (caller verifies password)
export async function selectAdminUserPwById(id: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT pw FROM admin_user_info WHERE id=?`,
    [id]
  );
  return rows[0]?.pw || null;
}

// Admin: countAdminUserByEmail
export async function countAdminUserByEmail(email: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT count(0) as cnt FROM admin_user_info WHERE email=?`,
    [email]
  );
  return rows[0]?.cnt ?? -1;
}

// Admin: countAdminUserByPhone (supports normalized phone matching)
export async function countAdminUserByPhone(phone: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT count(0) as cnt FROM admin_user_info WHERE REPLACE(phone, '-', '')=?`,
    [phone]
  );
  return rows[0]?.cnt ?? -1;
}

// Admin: countAdminUserByEmailExceptMe
export async function countAdminUserByEmailExceptMe(id: number, email: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT count(0) as cnt FROM admin_user_info WHERE id!=? AND email=?`,
    [id, email]
  );
  return rows[0]?.cnt ?? -1;
}

// Admin: countAdminUserByPhoneExceptMe
export async function countAdminUserByPhoneExceptMe(id: number, phone: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT count(0) as cnt FROM admin_user_info WHERE id!=? AND phone=?`,
    [id, phone]
  );
  return rows[0]?.cnt ?? -1;
}

// Admin: selectAdminUserIdByPhone
export async function selectAdminUserIdByPhone(phone: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM admin_user_info WHERE REPLACE(phone, '-', '')=?`,
    [phone]
  );
  return rows[0]?.id ?? -1;
}

// Admin: selectAdminUserByPhone — fetch by normalized phone with pw (caller verifies)
export async function selectAdminUserByPhone(phone: string): Promise<AdminUserInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, pw, phone, code FROM admin_user_info WHERE REPLACE(phone, '-', '')=?`,
    [phone]
  );
  return (rows[0] as AdminUserInfo) || null;
}

// Admin: updateAdminUserInfo (join/rejoin) — password must be pre-hashed by caller
export async function updateAdminUserInfo(email: string, hashedPw: string, phone: string): Promise<void> {
  await pool.query(
    `UPDATE admin_user_info SET email=?, pw=?, insert_time=now() WHERE REPLACE(phone, '-', '')=?`,
    [email, hashedPw, phone]
  );
}

// Admin: updateEmailPhoneById
export async function updateEmailPhoneById(id: number, email: string, phone: string): Promise<void> {
  await pool.query(
    `UPDATE admin_user_info SET email=?, phone=? WHERE id=?`,
    [email, phone, id]
  );
}

// Admin: updatePasswordById — password must be pre-hashed by caller
export async function updatePasswordById(id: number, hashedPw: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE admin_user_info SET pw=? WHERE id=?`,
    [hashedPw, id]
  );
  return result.affectedRows;
}

// Admin: updatePasswordByEmail — password must be pre-hashed by caller
export async function updatePasswordByEmail(email: string, hashedPw: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE admin_user_info SET pw=? WHERE email=?`,
    [hashedPw, email]
  );
  return result.affectedRows;
}

// Admin: updatePasswordByPhone — password must be pre-hashed by caller
export async function updatePasswordByPhone(phone: string, hashedPw: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE admin_user_info SET pw=? WHERE REPLACE(phone, '-', '')=?`,
    [hashedPw, phone]
  );
  return result.affectedRows;
}

// Admin: selectAdminEmailByPhone
export async function selectAdminEmailByPhone(phone: string): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT email FROM admin_user_info WHERE REPLACE(phone, '-', '')=?`,
    [phone]
  );
  return rows[0]?.email || null;
}

// Admin: selectAcaPhoneByTeacherId
export async function selectAcaPhoneByTeacherId(teacherId: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT aca_phone FROM aca_part WHERE teacher_id=?`,
    [teacherId]
  );
  return rows[0]?.aca_phone || null;
}

// Admin: selectTeacherList
export async function selectTeacherList(): Promise<{ name: string }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT name FROM teacher ORDER BY name ASC`
  );
  return rows as { name: string }[];
}

// Admin: selectTeacherUserList (code='T')
export async function selectTeacherUserList(): Promise<AdminUserInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, phone, code, date_format(insert_time, '%Y-%m-%d') as insertDate FROM admin_user_info WHERE code='T' ORDER BY name ASC`
  );
  return rows as AdminUserInfo[];
}

// Admin: insertTeacherUser
export async function insertTeacherUser(name: string, phone: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO admin_user_info (name, phone, code, insert_time) VALUES (?, ?, 'T', now())`,
    [name, phone]
  );
  return result.insertId;
}

// Admin: updateTeacherUser
export async function updateTeacherUser(id: number, name: string, email: string, phone: string): Promise<void> {
  await pool.query(
    `UPDATE admin_user_info SET name=?, email=?, phone=? WHERE id=? AND code='T'`,
    [name, email, phone, id]
  );
}

// Admin: deleteTeacherUser
export async function deleteTeacherUser(id: number): Promise<void> {
  await pool.query(
    `DELETE FROM admin_user_info WHERE id=? AND code='T'`,
    [id]
  );
}

// Admin: selectTeacherUserById
export async function selectTeacherUserById(id: number): Promise<AdminUserInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, email, phone, code FROM admin_user_info WHERE id=? AND code='T'`,
    [id]
  );
  return (rows[0] as AdminUserInfo) || null;
}

// Admin: insertStudentAnalysis
export async function insertStudentAnalysis(studentId: number, code: string): Promise<void> {
  await pool.query(
    `INSERT INTO student_analysis (student_id, code, insert_time) VALUES (?,?,now())`,
    [studentId, code]
  );
}

// Admin: chart queries
export async function newStudentChart(): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT date_format(insert_time, "%Y.%m") as gkey, count(0) as cnt FROM student_analysis WHERE code IN ("join", "rejoin") AND date_format(insert_time, "%Y%m") > date_format(now() - INTERVAL 14 MONTH, "%Y%m") GROUP BY gkey`
  );
  return rows;
}

export async function exitStudentChart(): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT date_format(insert_time, "%Y.%m") as gkey, count(0) as cnt FROM student_analysis WHERE code="exit" AND date_format(insert_time, "%Y%m") > date_format(now() - INTERVAL 14 MONTH, "%Y%m") GROUP BY gkey`
  );
  return rows;
}

export async function gradeYearPieChart(): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT concat(grade, year) as gkey, count(0) as cnt FROM student WHERE status=1 AND grade="고" GROUP BY gkey`
  );
  return rows;
}

export async function studentAnalysisPieChart(): Promise<Record<string, any>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT code as gkey, count(0) as cnt FROM student_analysis WHERE insert_time > now() - INTERVAL 1 MONTH GROUP BY gkey`
  );
  return rows;
}
