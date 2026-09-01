import pool from '../db';
import type { QnaPost, QnaComment } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// 이름 마스킹: 홍길동 → 홍ㅇㅇ
function maskName(name: string): string {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name[0] + 'ㅇ'.repeat(name.length - 1);
}

// 쿼리 결과에서 writer 생성 후 raw name/school 제거
function toWriterRow<T extends Record<string, any>>(row: T): Omit<T, 'name' | 'school'> & { writer: string } {
  const { name, school, ...rest } = row;
  return { ...rest, writer: `${school || ''} ${maskName(name || '')}`.trim() };
}

// 사이트맵용: 질문글 id + 날짜 목록 (본문 제외, 경량)
export async function selectQnaSitemap(): Promise<{ id: number; date: string }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, date_format(insert_time, '%Y-%m-%d') as date FROM qna_post ORDER BY id DESC LIMIT 2000`
  );
  return rows as { id: number; date: string }[];
}

// 목록 총 건수 (페이지네이션용)
export async function selectQnaPostCount(): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT count(0) as cnt FROM qna_post`);
  return Number(rows[0]?.cnt ?? 0);
}

// 목록 조회 (댓글 수 포함)
export async function selectQnaPostList(limit = 20, offset = 0): Promise<QnaPost[]> {
  // LIMIT/OFFSET 은 정수로 강제해 직접 삽입한다(MySQL 5.7 prepared LIMIT ? 비호환 회피).
  const lim = Math.min(500, Math.max(1, Math.trunc(limit) || 1));
  const off = Math.max(0, Math.trunc(offset) || 0);
  // MySQL 5.7 호환: 태그 제거는 앱(JS)에서. contents=발췌용 앞부분, firstImage=첫 이미지 src(위치 무관)
  const sql = `SELECT q.id, q.subject,
      LEFT(q.contents, 8000) as contents,
      CHAR_LENGTH(q.contents) as contentsLength,
      CASE WHEN LOCATE('src="', q.contents) = 0 THEN NULL
           ELSE SUBSTRING_INDEX(SUBSTRING(q.contents, LOCATE('src="', q.contents) + 5), '"', 1) END as firstImage,
      q.read_count as readCount,
      date_format(q.insert_time, "%Y.%m.%d") as date,
      (SELECT count(0) FROM qna_comment WHERE qna_post_id=q.id) as commentCount,
      s.name, s.school
    FROM qna_post q
    JOIN user_info u ON u.id=q.user_id
    JOIN student s ON s.id=u.student_id
    ORDER BY q.id DESC LIMIT ${lim} OFFSET ${off}`;
  const [rows] = await pool.query<RowDataPacket[]>(sql);
  return (rows as any[]).map(toWriterRow) as QnaPost[];
}

// 단건 조회 (마스킹 적용, 상세 페이지용)
export async function selectQnaPostById(id: number): Promise<QnaPost | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.id, q.subject, q.contents, q.user_id as userId,
      q.read_count as readCount, q.meta_description as metaDescription,
      date_format(q.insert_time, "%Y.%m.%d") as date,
      s.name, s.school
    FROM qna_post q
    JOIN user_info u ON u.id=q.user_id
    JOIN student s ON s.id=u.student_id
    WHERE q.id=?`,
    [id]
  );
  if (!rows[0]) return null;
  return toWriterRow(rows[0] as any) as QnaPost;
}

// 수정/삭제 시 본인 확인용 (최소 컬럼만 조회)
export async function selectQnaPostForEdit(id: number): Promise<Pick<QnaPost, 'id' | 'subject' | 'contents' | 'userId'> | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, contents, user_id as userId FROM qna_post WHERE id=?`,
    [id]
  );
  return (rows[0] as Pick<QnaPost, 'id' | 'subject' | 'contents' | 'userId'>) || null;
}

// 글 작성
export async function insertQnaPost(subject: string, contents: string, userId: number, metaDescription: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO qna_post (subject, contents, user_id, meta_description, read_count, insert_time) VALUES (?,?,?,?,0,now())`,
    [subject, contents, userId, metaDescription]
  );
  return result.insertId;
}

// 글 수정
export async function updateQnaPost(id: number, subject: string, contents: string, metaDescription: string): Promise<void> {
  await pool.query(
    `UPDATE qna_post SET subject=?, contents=?, meta_description=? WHERE id=?`,
    [subject, contents, metaDescription, id]
  );
}

// 글 삭제 (댓글 먼저 삭제)
export async function deleteQnaPost(id: number): Promise<void> {
  await pool.query(`DELETE FROM qna_comment WHERE qna_post_id=?`, [id]);
  await pool.query(`DELETE FROM qna_post WHERE id=?`, [id]);
}

// 조회수 증가. 글이 없으면 false (호출 측에서 중복 방지 쿠키를 남기지 않도록).
export async function updateQnaPostReadCount(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE qna_post SET read_count=read_count+1 WHERE id=?`,
    [id]
  );
  return result.affectedRows > 0;
}

// 게시글 존재 여부 확인
export async function existsQnaPost(id: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM qna_post WHERE id=? LIMIT 1`,
    [id]
  );
  return rows.length > 0;
}

// 댓글 목록 조회
export async function selectQnaCommentList(postId: number): Promise<QnaComment[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.text, c.user_id as userId, c.qna_post_id as qnaPostId,
      date_format(c.insert_time, "%Y-%m-%d") as date,
      s.name, s.school
    FROM qna_comment c
    JOIN user_info u ON u.id=c.user_id
    JOIN student s ON s.id=u.student_id
    WHERE c.qna_post_id=?
    ORDER BY c.id ASC`,
    [postId]
  );
  return (rows as any[]).map(toWriterRow) as QnaComment[];
}

// 댓글 작성
export async function insertQnaComment(text: string, userId: number, qnaPostId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO qna_comment (text, user_id, qna_post_id, insert_time) VALUES (?,?,?,now())`,
    [text, userId, qnaPostId]
  );
  return result.insertId;
}

// 댓글 단건 조회 (삭제 시 본인 확인용)
export async function selectQnaCommentById(id: number): Promise<Pick<QnaComment, 'id' | 'userId' | 'qnaPostId'> | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id as userId, qna_post_id as qnaPostId FROM qna_comment WHERE id=?`,
    [id]
  );
  return (rows[0] as Pick<QnaComment, 'id' | 'userId' | 'qnaPostId'>) || null;
}

// 댓글 삭제
export async function deleteQnaComment(id: number): Promise<void> {
  await pool.query(`DELETE FROM qna_comment WHERE id=?`, [id]);
}
