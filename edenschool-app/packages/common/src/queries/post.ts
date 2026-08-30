import pool from '../db';
import type { PostInfo, Comment } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// 사이트맵용: 게시글 id + 제목 + 카테고리 + 날짜 (본문 제외, 경량)
// 제목/카테고리는 slug URL(/board/{category}/{id}-{slug}) 조립에 필요하다.
export async function selectPostSitemap(): Promise<
  { id: number; subject: string; category: string | null; date: string }[]
> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, category, date_format(insert_time, '%Y-%m-%d') as date FROM post_info WHERE code='P' ORDER BY id DESC LIMIT 2000`
  );
  return rows as { id: number; subject: string; category: string | null; date: string }[];
}

// 목록 페이지네이션용 총 건수
export async function selectPostInfoCount(code: string, category?: string): Promise<number> {
  const params: any[] = [code];
  let where = ` WHERE code=?`;
  if (category) {
    where += ` AND category=?`;
    params.push(category);
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT count(0) as cnt FROM post_info${where}`,
    params
  );
  return Number(rows[0]?.cnt ?? 0);
}

// ROOT: selectPostInfoList
export async function selectPostInfoList(
  code: string,
  category?: string,
  limit = 500,
  offset = 0,
): Promise<PostInfo[]> {
  // LIMIT/OFFSET 은 정수로 강제해 직접 삽입한다(MySQL 5.7 prepared LIMIT ? 비호환 회피).
  const lim = Math.min(500, Math.max(1, Math.trunc(limit) || 1));
  const off = Math.max(0, Math.trunc(offset) || 0);
  const params: any[] = [code];
  let where = ` WHERE p.code=?`;
  if (category) {
    where += ` AND category=?`;
    params.push(category);
  }
  // MySQL 5.7 호환(REGEXP_* 미지원): 태그 제거는 앱(JS)에서 처리.
  // - contents: 발췌용으로 본문 앞 30000자(장황한 에디터 HTML도 텍스트 확보)
  // - firstImage: 문자열 함수로 첫 이미지 src만 추출(본문 어디에 있든, 위치 무관)
  const sql = `SELECT p.id, p.subject,
      LEFT(p.contents, 30000) as contents,
      CASE WHEN LOCATE('src="', p.contents) = 0 THEN NULL
           ELSE SUBSTRING_INDEX(SUBSTRING(p.contents, LOCATE('src="', p.contents) + 5), '"', 1) END as firstImage,
      p.code, p.category, p.user_id as userId, p.read_count as readCount,
      date_format(p.insert_time, "%Y.%m.%d") as date,
      (SELECT count(0) FROM comment WHERE post_id=p.id) as commentCount,
      a.name as writer
    FROM post_info p LEFT JOIN admin_user_info a ON a.id=p.user_id${where}
    ORDER BY p.id DESC LIMIT ${lim} OFFSET ${off}`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  return rows as PostInfo[];
}

// ROOT: selectPostInfoById
export async function selectPostInfoById(id: number): Promise<PostInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.subject, p.contents, p.code, p.category, p.read_count as readCount, p.meta_keyword as metaKeyword, p.meta_description as metaDescription, date_format(p.insert_time, "%Y.%m.%d") as date, a.name as writer FROM post_info p, admin_user_info a WHERE p.id=? AND a.id=p.user_id`,
    [id]
  );
  return (rows[0] as PostInfo) || null;
}

// ROOT: selectCommentList
export async function selectCommentList(postId: number): Promise<Comment[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.user_id as userId, c.text, s.name as writer, date_format(c.insert_time, "%Y-%m-%d") as date FROM comment c, student s, user_info u WHERE c.post_id=? AND u.id=c.user_id AND s.id=u.student_id`,
    [postId]
  );
  return rows as Comment[];
}

// ROOT: insertComment
export async function insertComment(text: string, userId: number, postId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO comment (text, user_id, post_id, insert_time) VALUES (?,?,?,now())`,
    [text, userId, postId]
  );
  return result.insertId;
}

// ROOT: selectCommentById
export async function selectCommentById(id: number): Promise<{ id: number; userId: number } | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, user_id as userId FROM comment WHERE id=?`,
    [id]
  );
  return (rows[0] as { id: number; userId: number }) || null;
}

// ROOT: deleteComment
export async function deleteComment(id: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM comment WHERE id=?`,
    [id]
  );
  return result.affectedRows;
}

// ROOT + Admin: updatePostReadCount
export async function updatePostReadCount(id: number): Promise<void> {
  await pool.query(`UPDATE post_info SET read_count=read_count+1 WHERE id=?`, [id]);
}

// Admin: selectPostList
export async function selectPostList(): Promise<PostInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.subject, p.code, p.category, p.read_count as readCount, date_format(p.insert_time, "%m/%d") as date, u.name as writer FROM post_info p, admin_user_info u WHERE u.id=p.user_id ORDER BY p.id DESC LIMIT 500`
  );
  return rows as PostInfo[];
}

// Admin: selectPostListByCode
export async function selectPostListByCode(code: string): Promise<PostInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.subject, p.code, p.category, p.read_count as readCount, date_format(p.insert_time, "%m/%d") as date, u.name as writer FROM post_info p, admin_user_info u WHERE p.code=? AND u.id=p.user_id ORDER BY p.id DESC LIMIT 500`,
    [code]
  );
  return rows as PostInfo[];
}

// Admin: selectPostById
export async function selectPostById(id: number): Promise<PostInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, contents, category, code, user_id as userId, meta_keyword as metaKeyword, meta_description as metaDescription FROM post_info WHERE id=?`,
    [id]
  );
  return (rows[0] as PostInfo) || null;
}

// Admin: insertPost
export async function insertPost(post: Pick<PostInfo, 'subject' | 'contents' | 'code' | 'userId' | 'category'> & { metaKeyword?: string; metaDescription?: string }): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO post_info (subject, contents, code, user_id, category, meta_keyword, meta_description, read_count, insert_time) VALUES (?,?,?,?,?,?,?,0,now())`,
    [post.subject, post.contents, post.code, post.userId, post.category, post.metaKeyword || '', post.metaDescription || '']
  );
  return result.insertId;
}

// Admin: updatePost
export async function updatePost(post: Pick<PostInfo, 'id' | 'subject' | 'contents' | 'code' | 'category'> & { metaKeyword?: string; metaDescription?: string }): Promise<void> {
  await pool.query(
    `UPDATE post_info SET subject=?, contents=?, code=?, category=?, meta_keyword=?, meta_description=? WHERE id=?`,
    [post.subject, post.contents, post.code, post.category, post.metaKeyword || '', post.metaDescription || '', post.id]
  );
}
