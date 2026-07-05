import pool from '../db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ============================================================
// 모의고사 기출 — 풀세트(mock_full) / 영역별(mock_section)
// ============================================================

export interface MockFullMeta {
  id: number;
  grade: string;
  year: number;
  month: number;
  fileType?: string;
  insertTime?: string;
  fileName?: string;
  contentId?: number;
}

export interface MockSectionMeta {
  id: number;
  area: string;
  subArea: string;
  grade: string;
  year: number;
  month: number;
  searchKeyword: string;
  fileType?: string;
  insertTime?: string;
  fileName?: string;
  contentId?: number;
}

export interface MockContent {
  id: number;
  metaId: number;
  fileName: string;
  content: Buffer;
}

// ── 풀세트: INSERT ──────────────────────────────────
export async function insertMockFullMeta(m: { grade: string; year: number; month: number; fileType: string }): Promise<number> {
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO mock_full_meta (grade, year, month, file_type, insert_time) VALUES (?,?,?,?,now())`,
    [m.grade, m.year, m.month, m.fileType]
  );
  return r.insertId;
}

export async function insertMockFullContent(metaId: number, content: Buffer, fileName: string): Promise<number> {
  // execute(바이너리 프로토콜): 대용량 BLOB도 패킷이 2배로 안 커짐
  const [r] = await pool.execute<ResultSetHeader>(
    `INSERT INTO mock_full_content (meta_id, content, file_name, insert_time) VALUES (?,?,?,now())`,
    [metaId, content, fileName]
  );
  return r.insertId;
}

// ── 영역별: INSERT ──────────────────────────────────
export async function insertMockSectionMeta(m: { area: string; subArea: string; grade: string; year: number; month: number; searchKeyword: string; fileType: string }): Promise<number> {
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO mock_section_meta (area, sub_area, grade, year, month, search_keyword, file_type, insert_time)
     VALUES (?,?,?,?,?,?,?,now())`,
    [m.area, m.subArea, m.grade, m.year, m.month, m.searchKeyword, m.fileType]
  );
  return r.insertId;
}

export async function insertMockSectionContent(metaId: number, content: Buffer, fileName: string): Promise<number> {
  // execute(바이너리 프로토콜): 대용량 BLOB도 패킷이 2배로 안 커짐
  const [r] = await pool.execute<ResultSetHeader>(
    `INSERT INTO mock_section_content (meta_id, content, file_name, insert_time) VALUES (?,?,?,now())`,
    [metaId, content, fileName]
  );
  return r.insertId;
}

// ── 다운로드용 content 조회 (meta id 기준) ──────────
export async function selectMockFullContentByMetaId(metaId: number): Promise<MockContent | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, meta_id as metaId, file_name as fileName, content FROM mock_full_content WHERE meta_id=?`,
    [metaId]
  );
  return (rows[0] as MockContent) || null;
}

export async function selectMockSectionContentByMetaId(metaId: number): Promise<MockContent | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, meta_id as metaId, file_name as fileName, content FROM mock_section_content WHERE meta_id=?`,
    [metaId]
  );
  return (rows[0] as MockContent) || null;
}

export async function selectMockFullContentsByMetaIds(metaIds: number[]): Promise<MockContent[]> {
  if (metaIds.length === 0) return [];
  const ph = metaIds.map(() => '?').join(',');
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, meta_id as metaId, file_name as fileName, content FROM mock_full_content WHERE meta_id IN (${ph})`,
    metaIds
  );
  return rows as MockContent[];
}

export async function selectMockSectionContentsByMetaIds(metaIds: number[]): Promise<MockContent[]> {
  if (metaIds.length === 0) return [];
  const ph = metaIds.map(() => '?').join(',');
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, meta_id as metaId, file_name as fileName, content FROM mock_section_content WHERE meta_id IN (${ph})`,
    metaIds
  );
  return rows as MockContent[];
}

// ── 삭제 (content는 FK ON DELETE CASCADE) ───────────
export async function deleteMockFullMetaById(id: number): Promise<void> {
  await pool.query(`DELETE FROM mock_full_meta WHERE id=?`, [id]);
}

export async function deleteMockSectionMetaById(id: number): Promise<void> {
  await pool.query(`DELETE FROM mock_section_meta WHERE id=?`, [id]);
}

// ── 풀세트 검색 (학년/년도/시행월 필터) ──────────────
export interface MockFullSearchParams {
  grade?: string[];
  year?: string[];
  month?: string[];
  page?: number;
  pageSize?: number;
}

export async function searchMockFull(params: MockFullSearchParams): Promise<{ list: MockFullMeta[]; total: number }> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  let where = 'WHERE 1=1';
  const qp: any[] = [];
  if (params.grade?.length) { where += ` AND m.grade IN (${params.grade.map(() => '?').join(',')})`; qp.push(...params.grade); }
  if (params.year?.length) { where += ` AND m.year IN (${params.year.map(() => '?').join(',')})`; qp.push(...params.year); }
  if (params.month?.length) { where += ` AND m.month IN (${params.month.map(() => '?').join(',')})`; qp.push(...params.month); }

  const [cnt] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM mock_full_meta m ${where}`, qp
  );
  const total = cnt[0].cnt as number;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.id, m.grade, m.year, m.month, m.file_type as fileType, m.insert_time as insertTime,
            c.file_name as fileName, c.id as contentId
     FROM mock_full_meta m LEFT JOIN mock_full_content c ON c.meta_id=m.id
     ${where}
     ORDER BY m.year DESC, m.month DESC, m.grade ASC, m.id DESC
     LIMIT ? OFFSET ?`,
    [...qp, pageSize, offset]
  );
  return { list: rows as MockFullMeta[], total };
}

// ── 영역별 검색 (영역/세부영역/학년/년도/시행월 + 키워드) ──
export interface MockSectionSearchParams {
  keyword?: string;
  area?: string[];
  subArea?: string[];
  grade?: string[];
  year?: string[];
  month?: string[];
  page?: number;
  pageSize?: number;
}

export async function searchMockSection(params: MockSectionSearchParams): Promise<{ list: MockSectionMeta[]; total: number }> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  let where = 'WHERE 1=1';
  const qp: any[] = [];
  if (params.keyword) {
    where += ' AND (m.search_keyword LIKE ? OR c.file_name LIKE ?)';
    const kw = `%${params.keyword}%`;
    qp.push(kw, kw);
  }
  if (params.area?.length) { where += ` AND m.area IN (${params.area.map(() => '?').join(',')})`; qp.push(...params.area); }
  if (params.subArea?.length) { where += ` AND m.sub_area IN (${params.subArea.map(() => '?').join(',')})`; qp.push(...params.subArea); }
  if (params.grade?.length) { where += ` AND m.grade IN (${params.grade.map(() => '?').join(',')})`; qp.push(...params.grade); }
  if (params.year?.length) { where += ` AND m.year IN (${params.year.map(() => '?').join(',')})`; qp.push(...params.year); }
  if (params.month?.length) { where += ` AND m.month IN (${params.month.map(() => '?').join(',')})`; qp.push(...params.month); }

  const [cnt] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM mock_section_meta m LEFT JOIN mock_section_content c ON c.meta_id=m.id ${where}`, qp
  );
  const total = cnt[0].cnt as number;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.id, m.area, m.sub_area as subArea, m.grade, m.year, m.month,
            m.search_keyword as searchKeyword, m.file_type as fileType, m.insert_time as insertTime,
            c.file_name as fileName, c.id as contentId
     FROM mock_section_meta m LEFT JOIN mock_section_content c ON c.meta_id=m.id
     ${where}
     ORDER BY m.id DESC
     LIMIT ? OFFSET ?`,
    [...qp, pageSize, offset]
  );
  return { list: rows as MockSectionMeta[], total };
}

// ── 필터 옵션용 distinct 조회 ────────────────────────
async function distinctCol(table: string, col: string, numeric = false): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT ${col} v FROM ${table} WHERE ${col} IS NOT NULL AND ${col} ${numeric ? '> 0' : "!= ''"} ORDER BY ${col} ${numeric ? 'DESC' : 'ASC'}`
  );
  return rows.map((r) => String(r.v));
}

export const selectMockFullGrades = () => distinctCol('mock_full_meta', 'grade');
export const selectMockFullYears = () => distinctCol('mock_full_meta', 'year', true);
export const selectMockFullMonths = () => distinctCol('mock_full_meta', 'month', true);

export const selectMockSectionAreas = () => distinctCol('mock_section_meta', 'area');
export const selectMockSectionSubAreas = () => distinctCol('mock_section_meta', 'sub_area');
export const selectMockSectionGrades = () => distinctCol('mock_section_meta', 'grade');
export const selectMockSectionYears = () => distinctCol('mock_section_meta', 'year', true);
export const selectMockSectionMonths = () => distinctCol('mock_section_meta', 'month', true);
