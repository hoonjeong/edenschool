import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-session';
import pool from '@edenschool/common/db';
import { selectFileInfoListById } from '@edenschool/common/queries/file';
import { selectLectureViewLogsByLectureId } from '@edenschool/common/queries/lecture-view-log';
import { selectQuestionListAdmin } from '@edenschool/common/queries/question';
import QuestionAnswerList from './QuestionAnswerList';

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

export default async function LectureViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireAdminSession();

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

  // Fetch view logs
  const viewLogs = await selectLectureViewLogsByLectureId(lectureId);

  // Fetch questions (with answers)
  const questions = await selectQuestionListAdmin(lectureId);

  // Extract Vimeo embed URL (only allow http/https)
  const vimeoUrl = lecture.url && /^https?:\/\//.test(lecture.url) ? lecture.url : '';

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

      {/* View Logs */}
      <div className="mb-4">
        <h5>영상 시청 기록 ({viewLogs.length})</h5>
        {viewLogs.length === 0 ? (
          <p className="text-muted">시청 기록이 없습니다.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped" style={{ fontSize: '0.88rem' }}>
              <thead className="table-primary">
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>이름</th>
                  <th>학교</th>
                  <th>학년</th>
                  <th>시작시간</th>
                  <th>종료시간</th>
                  <th>시청시간</th>
                  <th>영상구간</th>
                  <th>기기</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {viewLogs.map((log, i) => {
                  const formatSec = (sec?: number | null) => {
                    if (sec == null) return '-';
                    const m = Math.floor(sec / 60);
                    const s = sec % 60;
                    return `${m}:${String(s).padStart(2, '0')}`;
                  };
                  const dur = log.duration;
                  const durStr = dur == null ? '-' : dur < 60 ? `${dur}초` : `${Math.floor(dur / 60)}분 ${dur % 60 ? dur % 60 + '초' : ''}`.trim();
                  const device = log.deviceType === 'pc' ? 'PC' : log.deviceType === 'mobile' ? '모바일' : log.deviceType === 'tablet' ? '태블릿' : '기타';
                  return (
                    <tr key={log.id}>
                      <td className="text-center">{viewLogs.length - i}</td>
                      <td>{log.studentName}</td>
                      <td>{log.school}</td>
                      <td>{log.grade}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.startTime || '-'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.endTime || '-'}</td>
                      <td>{durStr}</td>
                      <td>{formatSec(log.startSeconds)} ~ {formatSec(log.endSeconds)}</td>
                      <td>{device}</td>
                      <td style={{ fontSize: '0.82rem' }}>{log.ip}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Questions & Answers */}
      <div className="mb-4">
        <h5>질문 &amp; 답변 ({questions.length})</h5>
        <QuestionAnswerList questions={questions} />
      </div>
    </div>
  );
}
