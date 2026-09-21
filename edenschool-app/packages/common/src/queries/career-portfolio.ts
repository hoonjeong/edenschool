import pool from '../db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * 「이든 진로탐색 도우미」 나의 진로 포트폴리오 (career_portfolio).
 * 테이블 DDL: sql/career-portfolio.sql — 적용 전엔 조회가 실패하므로 호출자가 안내 화면으로 처리한다.
 */

export type PortfolioKind = 'major' | 'job' | 'test' | 'summary';

export interface PortfolioItem {
  id: number;
  kind: PortfolioKind;
  refId: string;
  title: string;
  content: string | null;
  insertTime: string;
}

export async function selectPortfolioByUserId(userId: number): Promise<PortfolioItem[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, kind, ref_id AS refId, title, content, date_format(insert_time, '%Y-%m-%d %H:%i') AS insertTime
     FROM career_portfolio WHERE user_id=? ORDER BY id DESC`,
    [userId]
  );
  return rows as PortfolioItem[];
}

/** 같은 종류·같은 참조가 이미 있으면 true (요약은 날짜별로 여러 개 가능하므로 제외) */
export async function existsPortfolioItem(userId: number, kind: PortfolioKind, refId: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT count(0) AS cnt FROM career_portfolio WHERE user_id=? AND kind=? AND ref_id=?`, [
    userId,
    kind,
    refId,
  ]);
  return rows[0].cnt > 0;
}

export async function insertPortfolioItem(userId: number, kind: PortfolioKind, refId: string, title: string, content: string | null): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(`INSERT INTO career_portfolio (user_id, kind, ref_id, title, content) VALUES (?,?,?,?,?)`, [
    userId,
    kind,
    refId,
    title,
    content,
  ]);
  return result.insertId;
}

export async function deletePortfolioItem(id: number, userId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(`DELETE FROM career_portfolio WHERE id=? AND user_id=?`, [id, userId]);
  return result.affectedRows;
}
