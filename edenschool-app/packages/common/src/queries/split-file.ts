import pool from '../db';
import type { SplitFileMetaInfo, SplitFileContent } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function insertSplitFileMetaInfo(
  info: Omit<SplitFileMetaInfo, 'id' | 'insertTime'>
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO split_file_meta_info (grade, subject, publisher, search_keyword, school_name, year, term, test_type, file_type, insert_time)
     VALUES (?,?,?,?,?,?,?,?,?,now())`,
    [info.grade, info.subject, info.publisher, info.searchKeyword, info.schoolName, info.year, info.term, info.testType, info.fileType]
  );
  return result.insertId;
}

export async function insertSplitFileContent(
  metaId: number,
  content: Buffer,
  fileName: string
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO split_file_content (meta_id, content, file_name, insert_time) VALUES (?,?,?,now())`,
    [metaId, content, fileName]
  );
  return result.insertId;
}

export async function selectSplitFileMetaInfoById(
  id: number
): Promise<SplitFileMetaInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, grade, subject, publisher, search_keyword as searchKeyword, school_name as schoolName,
            year, term, test_type as testType, file_type as fileType, insert_time as insertTime
     FROM split_file_meta_info WHERE id=?`,
    [id]
  );
  return (rows[0] as SplitFileMetaInfo) || null;
}

export async function selectSplitFileContentByMetaId(
  metaId: number
): Promise<SplitFileContent | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, meta_id as metaId, file_name as fileName, content
     FROM split_file_content WHERE meta_id=?`,
    [metaId]
  );
  return (rows[0] as SplitFileContent) || null;
}

export async function deleteSplitFileMetaInfoById(id: number): Promise<void> {
  await pool.query(`DELETE FROM split_file_meta_info WHERE id=?`, [id]);
}

export async function selectSplitFileContentsByMetaIds(metaIds: number[]): Promise<SplitFileContent[]> {
  if (metaIds.length === 0) return [];
  const placeholders = metaIds.map(() => '?').join(',');
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, meta_id as metaId, file_name as fileName, content FROM split_file_content WHERE meta_id IN (${placeholders})`,
    metaIds
  );
  return rows as SplitFileContent[];
}

export async function deleteSplitFileContentByMetaId(metaId: number): Promise<void> {
  await pool.query(`DELETE FROM split_file_content WHERE meta_id=?`, [metaId]);
}

export interface SplitFileSearchParams {
  keyword?: string;
  grade?: string[];
  subject?: string[];
  publisher?: string[];
  page?: number;
  pageSize?: number;
}

export interface SplitFileSearchResult {
  list: (SplitFileMetaInfo & { fileName?: string; contentId?: number })[];
  total: number;
}

export async function searchSplitFiles(
  params: SplitFileSearchParams
): Promise<SplitFileSearchResult> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  let where = 'WHERE 1=1';
  const queryParams: any[] = [];

  if (params.keyword) {
    where += ' AND (m.search_keyword LIKE ? OR c.file_name LIKE ?)';
    const kw = `%${params.keyword}%`;
    queryParams.push(kw, kw);
  }
  if (params.grade && params.grade.length > 0) {
    where += ` AND m.grade IN (${params.grade.map(() => '?').join(',')})`;
    queryParams.push(...params.grade);
  }
  if (params.subject && params.subject.length > 0) {
    where += ` AND m.subject IN (${params.subject.map(() => '?').join(',')})`;
    queryParams.push(...params.subject);
  }
  if (params.publisher && params.publisher.length > 0) {
    where += ` AND m.publisher IN (${params.publisher.map(() => '?').join(',')})`;
    queryParams.push(...params.publisher);
  }

  const countQuery = `SELECT COUNT(*) as cnt FROM split_file_meta_info m LEFT JOIN split_file_content c ON c.meta_id=m.id ${where}`;
  const [countRows] = await pool.query<RowDataPacket[]>(countQuery, queryParams);
  const total = countRows[0].cnt as number;

  const dataQuery = `
    SELECT m.id, m.grade, m.subject, m.publisher, m.search_keyword as searchKeyword,
           m.school_name as schoolName, m.year, m.term, m.test_type as testType,
           m.file_type as fileType, m.insert_time as insertTime,
           c.file_name as fileName, c.id as contentId
    FROM split_file_meta_info m
    LEFT JOIN split_file_content c ON c.meta_id=m.id
    ${where}
    ORDER BY m.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [...queryParams, pageSize, offset]);

  return {
    list: rows as (SplitFileMetaInfo & { fileName?: string; contentId?: number })[],
    total,
  };
}

export async function selectSplitFileDistinctGrades(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT DISTINCT grade FROM split_file_meta_info WHERE grade IS NOT NULL AND grade != '' ORDER BY grade ASC"
  );
  return rows.map((r) => r.grade as string);
}
