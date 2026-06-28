import pool from '../db';
import type { FileInfo } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ROOT + Admin: selectFileInfoById
export async function selectFileInfoById(id: number): Promise<FileInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, filename, filedata FROM file_info WHERE id=?`,
    [id]
  );
  return (rows[0] as FileInfo) || null;
}

// ROOT + Admin: selectFileInfoListById (lecture files)
export async function selectFileInfoListById(lectureId: number): Promise<FileInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT i.id, i.filename, i.filedata FROM file_info i, file_status s WHERE s.lecture_id=? AND s.file_id=i.id`,
    [lectureId]
  );
  return rows as FileInfo[];
}

// ROOT + Admin: selectPostFileInfoListById
export async function selectPostFileInfoListById(postId: number): Promise<FileInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT i.id, i.filename, i.filedata FROM file_info i, post_file_status s WHERE s.post_id=? AND s.file_id=i.id`,
    [postId]
  );
  return rows as FileInfo[];
}

// Admin: insertFileInfo (DB BLOB 저장 - 레거시/구버전 경로)
export async function insertFileInfo(filename: string, filedata: Buffer): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO file_info (filename, filedata, insert_time) VALUES (?,?,now())`,
    [filename, filedata]
  );
  return result.insertId;
}

// Admin: insertFileInfoName (파일시스템 저장 - 파일명만 DB에, filedata는 NULL)
// 레거시와 동일 방식. 실제 바이트는 upload 폴더에 저장된다.
export async function insertFileInfoName(filename: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO file_info (filename, insert_time) VALUES (?, now())`,
    [filename]
  );
  return result.insertId;
}

// Admin: insertFileStatus
export async function insertFileStatus(lectureId: number, fileId: number): Promise<void> {
  await pool.query(
    `INSERT INTO file_status (lecture_id, file_id, insert_time) VALUES (?,?,now())`,
    [lectureId, fileId]
  );
}

// Admin: deleteFileStatusById
export async function deleteFileStatusById(fileId: number, lectureId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM file_status WHERE file_id=? AND lecture_id=?`,
    [fileId, lectureId]
  );
  return result.affectedRows;
}

// Admin: insertPostFileStatus
export async function insertPostFileStatus(postId: number, fileId: number): Promise<void> {
  await pool.query(
    `INSERT INTO post_file_status (post_id, file_id, insert_time) VALUES (?,?,now())`,
    [postId, fileId]
  );
}

// Admin: deletePostFileStatusByFileId
export async function deletePostFileStatusByFileId(fileId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM post_file_status WHERE file_id=?`,
    [fileId]
  );
  return result.affectedRows;
}

// ROOT: isFilePublicImage (teacher_display photo)
export async function isFilePublicImage(fileId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM teacher_display WHERE photo_file_id=? AND is_active=1 LIMIT 1`,
    [fileId]
  );
  return rows.length > 0;
}

// ROOT: isFileAccessibleByUser (post file or enrolled lecture file)
export async function isFileAccessibleByUser(fileId: number, userId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM post_file_status WHERE file_id=?
     UNION
     SELECT 1 FROM file_status fs
       JOIN lecture l ON l.id=fs.lecture_id
       JOIN class_status cs ON cs.class_id=l.class_id
       JOIN user_info u ON u.student_id=cs.student_id
     WHERE fs.file_id=? AND u.id=? AND cs.status=1
     LIMIT 1`,
    [fileId, fileId, userId]
  );
  return rows.length > 0;
}

// Admin: deleteFileInfoById
export async function deleteFileInfoById(fileId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `DELETE FROM file_info WHERE id=?`,
    [fileId]
  );
  return result.affectedRows;
}
