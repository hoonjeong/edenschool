import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectLectureById, isLectureAccessibleByStudent } from '@edenschool/common/queries/lecture';
import { selectFileInfoListById } from '@edenschool/common/queries/file';
import { selectQuestionList } from '@edenschool/common/queries/question';
import { selectLectureProgress } from '@edenschool/common/queries/lecture-progress';
import VimeoPlayer from './VimeoPlayer';
import QuestionForm from './QuestionForm';
import { sanitizeAdminHtml } from '@/lib/sanitize';

export default async function LectureViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/lecture-view');

  const params = await searchParams;
  const id = Number(params.id);
  if (!id) redirect('/lecture');

  const lecture = await selectLectureById(id);
  if (!lecture) redirect('/lecture');

  // 수강 등록 확인
  if (session.user.studentId) {
    const accessible = await isLectureAccessibleByStudent(id, session.user.studentId);
    if (!accessible) redirect('/lecture');
  }

  const [files, questions, progress] = await Promise.all([
    selectFileInfoListById(id),
    selectQuestionList(id),
    selectLectureProgress(session.user.id, id),
  ]);

  const isVimeo = lecture.url && (lecture.url.includes('vimeo.com') || lecture.url.includes('player.vimeo.com'));
  const isSafeUrl = lecture.url && /^https?:\/\//.test(lecture.url);
  const initialSeconds = progress?.watchedSeconds || 0;
  const progressPercent = progress?.percent || 0;

  return (
    <>
      {/* 다크 영상 영역 */}
      <div className="eden-video-wrapper">
        <div className="eden-video-container">
          {lecture.url && isSafeUrl && (
            isVimeo ? (
              <VimeoPlayer url={lecture.url} initialSeconds={initialSeconds} lectureId={id} />
            ) : (
              <div className="eden-video-player">
                <iframe
                  src={lecture.url}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )
          )}
          <h1 className="eden-video-title">{lecture.subject}</h1>
          <div className="eden-video-meta">
            {lecture.code === 'E' ? '특강' : '강의'}
          </div>
        </div>
        {isVimeo && (
          <div className="eden-progress-bar">
            <div className="eden-progress-track">
              <div className="eden-progress-fill" id="eden-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* 아래 콘텐츠 영역 - 1단 레이아웃 */}
      <div className="eden-video-below">
        {/* 선생님 말씀 */}
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-chalkboard-teacher"></i> 선생님 말씀
          </div>
          <div className="eden-card-body">
            {lecture.description ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeAdminHtml(lecture.description) }} />
            ) : (
              <div className="eden-empty" style={{ padding: '20px 0' }}>내용이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 첨부파일 */}
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-paperclip"></i> 첨부파일
          </div>
          <div className="eden-card-body">
            {files.length > 0 ? (
              files.map((file) => (
                <div key={file.id} className="eden-file-item">
                  <i className="fas fa-file-alt"></i>
                  <a href={`/api/file/download/${file.id}`} download>
                    {file.filename}
                  </a>
                </div>
              ))
            ) : (
              <div className="eden-empty" style={{ padding: '20px 0' }}>첨부파일이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 질문 */}
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-comment-dots"></i> 질문 ({questions.length})
          </div>
          <div className="eden-card-body">
            <QuestionForm lectureId={id} />
            {questions.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                {questions.map((q, i) => (
                  <div key={i} className="eden-comment">
                    <div className="eden-comment-header">
                      <span className="eden-comment-author">{q.writer}</span>
                      <span className="eden-comment-date">{q.date}</span>
                    </div>
                    <p className="eden-comment-text">{q.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="eden-empty" style={{ padding: '24px 0' }}>
                질문이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 강의 목록 버튼 */}
        <a href="/lecture" className="eden-btn eden-btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
          <i className="fas fa-list"></i> 강의 목록
        </a>
      </div>
    </>
  );
}
