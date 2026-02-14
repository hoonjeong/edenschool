import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-session';
import pool from '@edenschool/common/db';
import { selectFileInfoListById } from '@edenschool/common/queries/file';
import QuestionForm from './QuestionForm';

interface LectureRow {
  id: number;
  subject: string;
  class_name: string;
  teacher: string;
  description: string;
  url: string;
  date: string;
  code: string;
}

interface FileRow {
  id: number;
  filename: string;
  filesize: number;
}

interface QuestionRow {
  id: number;
  text: string;
  user_id: number;
  writer: string;
  lecture_id: number;
  date: string;
}

export default async function LectureViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireAdminSession();

  const { id } = await searchParams;
  if (!id) redirect('/admin/lecture-info');

  const lectureId = Number(id);

  // Fetch lecture with class name
  const [lectureRows] = await pool.query(
    `SELECT l.id, l.subject, l.description, l.url, l.teacher, l.code, l.lecture_date AS date, c.name as class_name
     FROM lecture l LEFT JOIN class_info c ON l.class_id=c.id
     WHERE l.id=?`,
    [lectureId]
  );
  const lectures = lectureRows as LectureRow[];
  if (lectures.length === 0) {
    return (
      <div>
        <div className="alert alert-danger">강의를 찾을 수 없습니다.</div>
        <Link href="/admin/lecture-info" className="btn btn-secondary">
          목록으로
        </Link>
      </div>
    );
  }
  const lecture = lectures[0];

  // Fetch files
  const files = await selectFileInfoListById(lectureId);

  // Fetch questions
  const [questionRows] = await pool.query(
    `SELECT q.id, q.text, q.user_id, s.name as writer, date_format(q.insert_time, "%Y-%m-%d") as date
     FROM question q, student s, user_info u
     WHERE q.lecture_id=? AND u.id=q.user_id AND s.id=u.student_id
     ORDER BY q.id`,
    [lectureId]
  );
  const questions = questionRows as QuestionRow[];

  // Extract Vimeo embed URL
  const vimeoUrl = lecture.url || '';

  return (
    <div>
      <h4 className="mb-3">{lecture.subject}</h4>

      <div className="mb-2">
        <Link href="/admin/lecture-info" className="btn btn-secondary btn-sm mr-2">
          목록
        </Link>
        <Link
          href={`/admin/lecture-modify?id=${lecture.id}`}
          className="btn btn-warning btn-sm"
        >
          수정
        </Link>
      </div>

      {/* Lecture info */}
      <table className="table table-bordered mb-4">
        <tbody>
          <tr>
            <th className="bg-light" style={{ width: '15%' }}>선생님</th>
            <td>{lecture.teacher}</td>
          </tr>
          <tr>
            <th className="bg-light">반이름</th>
            <td>{lecture.class_name}</td>
          </tr>
          <tr>
            <th className="bg-light">날짜</th>
            <td>{lecture.date}</td>
          </tr>
          <tr>
            <th className="bg-light">코드</th>
            <td>{lecture.code}</td>
          </tr>
        </tbody>
      </table>

      {/* Vimeo video */}
      {vimeoUrl && (
        <div className="mb-4">
          <h5>영상</h5>
          <div
            style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              maxWidth: '100%',
            }}
          >
            <iframe
              src={vimeoUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="lecture-video"
            />
          </div>
        </div>
      )}

      {/* Description */}
      {lecture.description && (
        <div className="mb-4">
          <h5>선생님 설명</h5>
          <div className="card">
            <div
              className="card-body"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {lecture.description}
            </div>
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div className="mb-4">
          <h5>첨부파일</h5>
          <ul className="list-group">
            {files.map((file) => (
              <li key={file.id} className="list-group-item">
                <a href={`/api/admin/file/${file.id}`} download>
                  <i className="fas fa-download mr-1" />
                  {file.filename}
                </a>
                {file.filesize && (
                  <span className="text-muted ml-2">
                    ({(file.filesize / 1024).toFixed(1)} KB)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions */}
      <div className="mb-4">
        <h5>질문 ({questions.length})</h5>

        <QuestionForm lectureId={lectureId} userId={session.user!.id} />

        {questions.length === 0 ? (
          <p className="text-muted mt-2">질문이 없습니다.</p>
        ) : (
          <div className="mt-3">
            {questions.map((q) => (
              <div key={q.id} className="card mb-2">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <strong>{q.writer || '알 수 없음'}</strong>
                    <small className="text-muted">{q.date}</small>
                  </div>
                  <p className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {q.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
