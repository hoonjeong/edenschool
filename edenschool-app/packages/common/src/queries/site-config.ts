import pool from '../db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ────────────────────── site_popup ──────────────────────

export interface SitePopup {
  id: number;
  is_active: number;
  image_file_id: number | null;
  link_url: string;
  start_date: string | null;
  end_date: string | null;
  updated_at: string;
}

// ───── 다중 팝업: 목록/추가/수정/삭제 ─────

const POPUP_COLS = `id, is_active, image_file_id, link_url, DATE_FORMAT(start_date,'%Y-%m-%d') as start_date, DATE_FORMAT(end_date,'%Y-%m-%d') as end_date, updated_at`;

// 관리자: 전체 팝업 목록(최신순)
export async function selectAllPopups(): Promise<SitePopup[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${POPUP_COLS} FROM site_popup ORDER BY id DESC`
  );
  return rows as SitePopup[];
}

// 프론트: 활성 + 기간 내 팝업 목록(모두 표시)
export async function selectActivePopups(): Promise<SitePopup[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${POPUP_COLS} FROM site_popup
     WHERE is_active=1 AND image_file_id IS NOT NULL
       AND (start_date IS NULL OR start_date <= CURDATE())
       AND (end_date IS NULL OR end_date >= CURDATE())
     ORDER BY id DESC`
  );
  return rows as SitePopup[];
}

interface PopupInput {
  is_active: number;
  image_file_id: number | null;
  link_url: string;
  start_date: string | null;
  end_date: string | null;
}

// 관리자: 팝업 추가
export async function insertPopup(data: PopupInput): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO site_popup (is_active, image_file_id, link_url, start_date, end_date) VALUES (?,?,?,?,?)`,
    [data.is_active, data.image_file_id, data.link_url, data.start_date || null, data.end_date || null]
  );
  return result.insertId;
}

// 관리자: 팝업 수정(전체 필드)
export async function updatePopupById(id: number, data: PopupInput): Promise<void> {
  await pool.query(
    `UPDATE site_popup SET is_active=?, image_file_id=?, link_url=?, start_date=?, end_date=? WHERE id=?`,
    [data.is_active, data.image_file_id, data.link_url, data.start_date || null, data.end_date || null, id]
  );
}

// 관리자: 팝업 삭제
export async function deletePopupById(id: number): Promise<void> {
  await pool.query(`DELETE FROM site_popup WHERE id=?`, [id]);
}

// ────────────────────── site_page ──────────────────────

export interface SitePage {
  id: number;
  page_key: string;
  html: string | null;
  css: string | null;
  gjsdata: string | null;
  updated_at: string;
}

export async function selectSitePage(pageKey: string): Promise<SitePage | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM site_page WHERE page_key=?`,
    [pageKey]
  );
  return (rows[0] as SitePage) || null;
}

export async function upsertSitePage(pageKey: string, html: string, css: string, gjsdata: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM site_page WHERE page_key=?`,
    [pageKey]
  );
  if (rows.length > 0) {
    await pool.query(
      `UPDATE site_page SET html=?, css=?, gjsdata=? WHERE page_key=?`,
      [html, css, gjsdata, pageKey]
    );
  } else {
    await pool.query(
      `INSERT INTO site_page (page_key, html, css, gjsdata) VALUES (?,?,?,?)`,
      [pageKey, html, css, gjsdata]
    );
  }
}

// ────────────────────── class_display ──────────────────────

export interface ClassDisplay {
  id: number;
  class_id: number;
  teacher_image_file_id: number | null;
  description: string;
  progress_info: string;
  clinic_info: string;
  introduction: string;
  sort_order: number;
  is_active: number;
  updated_at: string;
  // joined fields
  class_name?: string;
  class_day?: string;
  class_hour?: string;
  class_minute?: string;
}

export async function selectClassDisplayListAdmin(): Promise<ClassDisplay[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cd.*, ci.name as class_name, ci.day as class_day, ci.hour as class_hour, ci.minute as class_minute
     FROM class_display cd
     LEFT JOIN class_info ci ON cd.class_id = ci.id
     ORDER BY cd.sort_order ASC, cd.id ASC`
  );
  return rows as ClassDisplay[];
}

export async function selectClassDisplayListActive(): Promise<ClassDisplay[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cd.*, ci.name as class_name, ci.day as class_day, ci.hour as class_hour, ci.minute as class_minute
     FROM class_display cd
     LEFT JOIN class_info ci ON cd.class_id = ci.id
     WHERE cd.is_active=1
     ORDER BY cd.sort_order ASC, cd.id ASC`
  );
  return rows as ClassDisplay[];
}

export async function insertClassDisplay(data: {
  class_id: number;
  teacher_image_file_id: number | null;
  description: string;
  progress_info: string;
  clinic_info: string;
  introduction: string;
  sort_order: number;
  is_active: number;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO class_display (class_id, teacher_image_file_id, description, progress_info, clinic_info, introduction, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?)`,
    [data.class_id, data.teacher_image_file_id, data.description, data.progress_info, data.clinic_info, data.introduction, data.sort_order, data.is_active]
  );
  return result.insertId;
}

export async function updateClassDisplay(id: number, data: {
  class_id: number;
  teacher_image_file_id: number | null;
  description: string;
  progress_info: string;
  clinic_info: string;
  introduction: string;
  sort_order: number;
  is_active: number;
}): Promise<void> {
  await pool.query(
    `UPDATE class_display SET class_id=?, teacher_image_file_id=?, description=?, progress_info=?, clinic_info=?, introduction=?, sort_order=?, is_active=? WHERE id=?`,
    [data.class_id, data.teacher_image_file_id, data.description, data.progress_info, data.clinic_info, data.introduction, data.sort_order, data.is_active, id]
  );
}

export async function deleteClassDisplay(id: number): Promise<void> {
  await pool.query(`DELETE FROM class_display WHERE id=?`, [id]);
}

// ────────────────────── teacher_display ──────────────────────

export interface TeacherDisplay {
  id: number;
  section: string;
  branch: string | null;
  school: string | null;
  name: string;
  role: string | null;
  photo_url: string | null;
  photo_file_id: number | null;
  schedule_data: string | null;
  sort_order: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export async function selectTeacherDisplayList(): Promise<TeacherDisplay[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM teacher_display ORDER BY FIELD(section,'HIGH_SCHOOL','MIDDLE_SCHOOL','SUNEUNG','ELEMENTARY','STAFF'), sort_order ASC, id ASC`
  );
  return rows as TeacherDisplay[];
}

export async function selectTeacherDisplayListActive(): Promise<TeacherDisplay[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM teacher_display WHERE is_active=1 ORDER BY FIELD(section,'HIGH_SCHOOL','MIDDLE_SCHOOL','SUNEUNG','ELEMENTARY','STAFF'), sort_order ASC, id ASC`
  );
  return rows as TeacherDisplay[];
}

export async function insertTeacherDisplay(data: {
  section: string;
  branch?: string | null;
  school?: string | null;
  name: string;
  role?: string | null;
  photo_url?: string | null;
  photo_file_id?: number | null;
  schedule_data?: string | null;
  sort_order: number;
  is_active: number;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO teacher_display (section, branch, school, name, role, photo_url, photo_file_id, schedule_data, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [data.section, data.branch || null, data.school || null, data.name, data.role || null, data.photo_url || null, data.photo_file_id || null, data.schedule_data || null, data.sort_order, data.is_active]
  );
  return result.insertId;
}

export async function updateTeacherDisplay(id: number, data: {
  section: string;
  branch?: string | null;
  school?: string | null;
  name: string;
  role?: string | null;
  photo_url?: string | null;
  photo_file_id?: number | null;
  schedule_data?: string | null;
  sort_order: number;
  is_active: number;
}): Promise<void> {
  await pool.query(
    `UPDATE teacher_display SET section=?, branch=?, school=?, name=?, role=?, photo_url=?, photo_file_id=?, schedule_data=?, sort_order=?, is_active=? WHERE id=?`,
    [data.section, data.branch || null, data.school || null, data.name, data.role || null, data.photo_url || null, data.photo_file_id || null, data.schedule_data || null, data.sort_order, data.is_active, id]
  );
}

export async function deleteTeacherDisplay(id: number): Promise<void> {
  await pool.query(`DELETE FROM teacher_display WHERE id=?`, [id]);
}
