import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import {
  selectTestPlanById,
  selectStudentTestResultById,
  selectTestAver,
  selectTestClassAver,
} from '@edenschool/common/queries/test';

export default async function TestViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/test-view');

  const params = await searchParams;
  const id = Number(params.id);
  if (!id) redirect('/test');

  const plan = await selectTestPlanById(id);
  if (!plan) redirect('/test');

  const results = await selectStudentTestResultById(session.user.studentId!, plan.testInfoId);
  const totalAver = await selectTestAver(plan.testInfoId);
  const classAver = await selectTestClassAver(plan.testInfoId, plan.classId);

  const correctCount = results.filter((r) => r.resultAnswer !== null && r.answer === r.resultAnswer).length;
  const submittedCount = results.filter((r) => r.resultAnswer !== null).length;

  return (
    <div className="container mt-4">
      <h4>{plan.subject}</h4>
      <p className="text-muted">{plan.date}</p>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title">내 정답</h6>
              <p className="card-text h4">{correctCount} / {results.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title">반 평균</h6>
              <p className="card-text h4">{classAver}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title">전체 평균</h6>
              <p className="card-text h4">{totalAver}</p>
            </div>
          </div>
        </div>
      </div>

      {plan.fileId && (
        <div className="mb-3">
          <a href={`/api/file/download/${plan.fileId}`} className="btn btn-outline-primary btn-sm">
            <i className="fas fa-download" /> 시험지 다운로드
          </a>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h6 className="card-title">답안 ({submittedCount} / {results.length} 제출)</h6>
          <form action="/api/test/submit" method="POST">
            <input type="hidden" name="testInfoId" value={plan.testInfoId} />
            <input type="hidden" name="studentId" value={session.user.studentId} />
            <input type="hidden" name="planId" value={id} />
            <table className="table table-bordered table-sm">
              <thead className="thead-light">
                <tr>
                  <th>번호</th>
                  <th>정답</th>
                  <th>내 답</th>
                  <th>결과</th>
                  <th>답안 입력</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isCorrect = r.resultAnswer !== null && r.answer === r.resultAnswer;
                  const isSubmitted = r.resultAnswer !== null;
                  return (
                    <tr key={r.num} className={isSubmitted ? (isCorrect ? 'table-success' : 'table-danger') : ''}>
                      <td>{r.num}</td>
                      <td>{isSubmitted ? r.answer : '-'}</td>
                      <td>{isSubmitted ? r.resultAnswer : '-'}</td>
                      <td>{isSubmitted ? (isCorrect ? 'O' : 'X') : '-'}</td>
                      <td>
                        {!isSubmitted && (
                          <select name={`answer_${r.num}`} className="form-control form-control-sm" defaultValue="">
                            <option value="">선택</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {submittedCount < results.length && (
              <button type="submit" className="btn btn-primary">제출</button>
            )}
          </form>
        </div>
      </div>

      <a href="/test" className="btn btn-secondary">목록</a>
    </div>
  );
}
