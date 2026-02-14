import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectLectureById } from '@edenschool/common/queries/lecture';
import { selectFileInfoListById } from '@edenschool/common/queries/file';
import { selectQuestionList } from '@edenschool/common/queries/question';

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

  const files = await selectFileInfoListById(id);
  const questions = await selectQuestionList(id);

  return (
    <div className="container mt-4">
      <h4>{lecture.subject}</h4>

      {lecture.url && (
        <div className="mb-4">
          <div className="embed-responsive embed-responsive-16by9" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={lecture.url}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {lecture.description && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">강의 설명</h6>
            <div dangerouslySetInnerHTML={{ __html: lecture.description }} />
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">첨부파일</h6>
            <ul className="list-unstyled mb-0">
              {files.map((file) => (
                <li key={file.id}>
                  <a href={`/api/file/download/${file.id}`} download>
                    <i className="fas fa-download" /> {file.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h6 className="card-title">질문 ({questions.length})</h6>
          <form action="/api/question" method="POST" className="mb-3">
            <input type="hidden" name="lectureId" value={id} />
            <input type="hidden" name="userId" value={session.user.id} />
            <div className="input-group">
              <input type="text" name="text" className="form-control" placeholder="질문을 입력하세요" required />
              <div className="input-group-append">
                <button type="submit" className="btn btn-primary">등록</button>
              </div>
            </div>
          </form>
          {questions.length > 0 ? (
            <ul className="list-group">
              {questions.map((q, i) => (
                <li key={i} className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <strong>{q.writer}</strong>
                    <small className="text-muted">{q.date}</small>
                  </div>
                  <p className="mb-0 mt-1">{q.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-0">질문이 없습니다.</p>
          )}
        </div>
      </div>

      <a href="/lecture" className="btn btn-secondary">목록</a>
    </div>
  );
}
