import pool from '../db';
import type { Lecture } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ROOT: selectLectureListByStudentId
export async function selectLectureListByStudentId(studentId: number): Promise<Lecture[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT l.subject, l.id, l.teacher, l.lecture_date as lectureDate FROM lecture l, class_status s WHERE s.student_id=? AND l.class_id=s.class_id AND l.insert_time>s.start_time AND if(s.end_time IS NULL, now(), s.end_time)>l.insert_time ORDER BY l.id DESC`,
    [studentId]
  );
  return rows as Lecture[];
}

// ROOT: selectSpecialLectureListByStudentId
export async function selectSpecialLectureListByStudentId(studentId: number): Promise<Lecture[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT l.subject, l.id, l.teacher, l.lecture_date as lectureDate FROM lecture l, class_status s WHERE s.student_id=? AND l.code="E" AND l.insert_time>(s.start_time - INTERVAL 1 MONTH) AND if(s.end_time IS NULL, now(), s.end_time)>l.insert_time ORDER BY id DESC`,
    [studentId]
  );
  return rows as Lecture[];
}

// ROOT: selectLectureListByCode
export async function selectLectureListByCode(code: string): Promise<Lecture[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT subject, id, teacher, lecture_date as lectureDate FROM lecture WHERE code=? ORDER BY id DESC LIMIT 500`,
    [code]
  );
  return rows as Lecture[];
}

// ROOT: selectLectureById
export async function selectLectureById(id: number): Promise<Lecture | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, code, description, url FROM lecture WHERE id=?`,
    [id]
  );
  return (rows[0] as Lecture) || null;
}

/** 강의의 담당 선생님 이름 조회 (소유권 검증용) */
export async function selectLectureTeacherById(id: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT teacher FROM lecture WHERE id=?`,
    [id]
  );
  return rows[0]?.teacher || null;
}

/** 학생이 해당 강의에 접근 가능한지 확인 (수강 등록 또는 공개 강의) */
export async function isLectureAccessibleByStudent(lectureId: number, studentId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM lecture l WHERE l.id=? AND (
      l.code IN ('F','S')
      OR EXISTS (
        SELECT 1 FROM class_status s
        WHERE s.student_id=? AND l.class_id=s.class_id
          AND l.insert_time>s.start_time
          AND IF(s.end_time IS NULL, NOW(), s.end_time)>l.insert_time
      )
      OR (l.code='E' AND EXISTS (
        SELECT 1 FROM class_status s
        WHERE s.student_id=?
          AND l.insert_time>(s.start_time - INTERVAL 1 MONTH)
          AND IF(s.end_time IS NULL, NOW(), s.end_time)>l.insert_time
      ))
    ) LIMIT 1`,
    [lectureId, studentId, studentId]
  );
  return rows.length > 0;
}

// Admin: searchLectureList (강의관리 — 서버사이드 검색 + 페이징)
// months: 최근 N개월 이내 등록분만 조회 (기본 6개월). 0 또는 null 이면 전체 기간.
export async function searchLectureList(params: { search?: string; page?: number; pageSize?: number; months?: number | null }): Promise<{ list: Lecture[]; total: number }> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  const conds: string[] = [];
  const qp: any[] = [];
  if (params.search) {
    conds.push(`(l.subject LIKE ? OR l.teacher LIKE ? OR i.name LIKE ? OR l.lecture_date LIKE ?)`);
    const kw = `%${params.search}%`;
    qp.push(kw, kw, kw, kw);
  }
  // lecture_date 는 자유 입력 문자열이라 기간 계산에 쓸 수 없어 등록 시각(insert_time) 기준으로 자른다.
  const months = Math.floor(Number(params.months ?? 6));
  if (months > 0) {
    conds.push(`l.insert_time >= DATE_SUB(NOW(), INTERVAL ${months} MONTH)`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [cnt] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM lecture l LEFT JOIN class_info i ON l.class_id=i.id ${where}`,
    qp
  );
  const total = cnt[0].cnt as number;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.id, l.subject, l.teacher, if(i.name IS NULL, "특강", i.name) as className, l.code, l.lecture_date as lectureDate
     FROM lecture l LEFT JOIN class_info i ON l.class_id=i.id
     ${where}
     ORDER BY l.id DESC
     LIMIT ? OFFSET ?`,
    [...qp, pageSize, offset]
  );
  return { list: rows as Lecture[], total };
}

// Admin: selectLectureListByAdminName
export async function selectLectureListByAdminName(name: string): Promise<Lecture[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT subject, id, teacher, lecture_date as lectureDate FROM lecture WHERE teacher=? ORDER BY id DESC LIMIT 300`,
    [name]
  );
  return rows as Lecture[];
}

// Admin: selectSpecialLectureModifyById
export async function selectSpecialLectureModifyById(id: number): Promise<Lecture | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, description, url, teacher, code, lecture_date as lectureDate FROM lecture WHERE id=?`,
    [id]
  );
  return (rows[0] as Lecture) || null;
}

// Admin: insertLecture
export async function insertLecture(lecture: Omit<Lecture, 'id'>): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO lecture (subject, description, url, teacher, code, class_id, insert_time, lecture_date) VALUES (?,?,?,?,?,?,now(),?)`,
    [lecture.subject, lecture.description, lecture.url, lecture.teacher, lecture.code, lecture.classId, lecture.lectureDate]
  );
  return result.insertId;
}

// Admin: modifyLecture
export async function modifyLecture(lecture: Lecture): Promise<void> {
  await pool.query(
    `UPDATE lecture SET subject=?, description=?, url=?, teacher=?, code=?, class_id=?, lecture_date=? WHERE id=?`,
    [lecture.subject, lecture.description, lecture.url, lecture.teacher, lecture.code, lecture.classId, lecture.lectureDate, lecture.id]
  );
}

// Admin: deleteLectureById
export async function deleteLectureById(id: number): Promise<void> {
  await pool.query(`DELETE FROM lecture WHERE id=?`, [id]);
}

// Admin: selectLectureListByStudentIdAdmin
export async function selectLectureListByStudentIdAdmin(studentId: number): Promise<Lecture[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.id, l.subject, l.teacher, if(i.name IS NULL, "특강", i.name) as className, l.code, l.lecture_date as lectureDate FROM lecture l, class_status s, class_info i WHERE s.student_id=? AND l.class_id=s.class_id AND i.id=s.class_id AND l.insert_time>s.start_time AND if(s.end_time IS NULL, now(), s.end_time)>l.insert_time ORDER BY l.id DESC`,
    [studentId]
  );
  return rows as Lecture[];
}
