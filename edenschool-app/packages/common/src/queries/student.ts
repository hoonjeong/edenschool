import pool from '../db';
import type { Student } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ROOT: selectStudentById
export async function selectStudentById(studentId: number): Promise<Student | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM student WHERE id=?`,
    [studentId]
  );
  return (rows[0] as Student) || null;
}

// Admin: selectStudentsByNameAndPhone — 신규 등록 시 같은 학생이 이미 있는지 확인한다.
// 이름 + 연락처로만 찾는다. 학교·학년은 진학하면 바뀌므로 판별 기준으로 쓸 수 없다.
// 두 연락처를 모두 비워두고 등록하면(둘 다 '') 매칭하지 않는다 — 이름만으로는 동명이인과 구분할 수 없다.
// status DESC 정렬이라 재원생(1)이 퇴원생(0)보다 앞에 온다.
export async function selectStudentsByNameAndPhone(
  name: string,
  sphone: string,
  pphone: string,
): Promise<Student[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, school, grade, year, sphone, pphone, status,
            date_format(modify_date, "%Y-%m-%d") as date
       FROM student
      WHERE name = ?
        AND ( (? <> '' AND sphone = ?) OR (? <> '' AND pphone = ?) )
      ORDER BY status DESC, modify_date DESC, id DESC`,
    [name, sphone, sphone, pphone, pphone]
  );
  return rows as Student[];
}

// Admin: insertStudent
export async function insertStudent(student: Omit<Student, 'id'>): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO student (name, school, grade, year, sphone, pphone, address, specialty, memo, insert_date, modify_date, status) VALUES (?,?,?,?,?,?,?,?,?,now(),now(),1)`,
    [student.name, student.school, student.grade, student.year, student.sphone, student.pphone, student.address, student.specialty, student.memo]
  );
  return result.insertId;
}

// Admin: modifyStudent
export async function modifyStudent(student: Student): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE student SET name=?, school=?, grade=?, year=?, sphone=?, pphone=?, address=?, specialty=?, memo=?, modify_date=now() WHERE id=?`,
    [student.name, student.school, student.grade, student.year, student.sphone, student.pphone, student.address, student.specialty, student.memo, student.id]
  );
  return result.affectedRows;
}

// Admin: updateStudentStatus
export async function updateStudentStatus(id: number, status: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE student SET status=?, modify_date=now() WHERE id=?`,
    [status, id]
  );
  return result.affectedRows;
}

// Admin: selectNewStudentList
export async function selectNewStudentList(): Promise<Student[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, school, grade, year, date_format(insert_date, "%m/%d") as date FROM student WHERE status=1 AND insert_date=modify_date AND insert_date > now() - INTERVAL 1 MONTH ORDER BY insert_date DESC`
  );
  return rows as Student[];
}

// Admin: selectReStudentList
export async function selectReStudentList(): Promise<Student[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, school, grade, year, date_format(modify_date, "%m/%d") as date FROM student WHERE status=1 AND insert_date!=modify_date AND modify_date > now() - INTERVAL 1 MONTH ORDER BY modify_date DESC`
  );
  return rows as Student[];
}

// Admin: selectExitStudentOneMonthList
export async function selectExitStudentOneMonthList(): Promise<Student[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT name, school, grade, year, id, date_format(modify_date, "%m/%d") as date FROM student WHERE status=0 AND modify_date > now() - INTERVAL 1 MONTH ORDER BY modify_date DESC`
  );
  return rows as Student[];
}

// Admin(원장): 전체 재원 학생 목록 (학생 관리 페이지용)
export async function selectAllActiveStudents(): Promise<Student[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, school, grade, year, sphone, pphone, status FROM student WHERE status=1 ORDER BY name ASC`
  );
  return rows as Student[];
}

// Admin(원장): 전체 퇴원 학생 목록 (퇴원생 관리 페이지용)
export async function selectAllExitedStudents(): Promise<Student[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, school, grade, year, sphone, pphone, status, date_format(modify_date, '%Y-%m-%d') as modifyDate FROM student WHERE status=0 ORDER BY modify_date DESC`
  );
  return rows as Student[];
}

// Admin: selectStudentListById (students in a class)
export async function selectStudentListByClassId(classId: number): Promise<Student[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT s.* FROM student s, class_status cs WHERE cs.class_id=? AND cs.status=1 AND s.id=cs.student_id ORDER BY s.name ASC`,
    [classId]
  );
  return rows as Student[];
}

// Admin: selectClassStudentListByClassId
export async function selectClassStudentListByClassId(classId: number): Promise<Student[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cs.id as classStatusId, s.id, s.name, s.school, s.grade, s.year FROM class_status cs, student s WHERE cs.class_id=? AND cs.status=1 AND s.id=cs.student_id ORDER BY s.name ASC`,
    [classId]
  );
  return rows as Student[];
}
