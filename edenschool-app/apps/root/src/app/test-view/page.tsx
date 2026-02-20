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
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>{plan.subject}</h2>
        <p>{plan.date}</p>
      </div>

      <div className="eden-stat-row">
        <div className="eden-stat-card">
          <div className="stat-label">내 정답</div>
          <div className="stat-value">{correctCount} / {results.length}</div>
        </div>
        <div className="eden-stat-card">
          <div className="stat-label">반 평균</div>
          <div className="stat-value">{classAver}</div>
        </div>
        <div className="eden-stat-card">
          <div className="stat-label">전체 평균</div>
          <div className="stat-value">{totalAver}</div>
        </div>
      </div>

      {plan.fileId && (
        <div style={{ marginBottom: 16 }}>
          <a href={`/api/file/download/${plan.fileId}`} className="eden-btn eden-btn-outline eden-btn-sm">
            <i className="fas fa-download" /> 시험지 다운로드
          </a>
        </div>
      )}

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-clipboard-check"></i> 답안 ({submittedCount} / {results.length} 제출)
        </div>
        <div className="eden-card-body">
          <form action="/api/test/submit" method="POST">
            <input type="hidden" name="testInfoId" value={plan.testInfoId} />
            <input type="hidden" name="studentId" value={session.user.studentId} />
            <input type="hidden" name="planId" value={id} />
            <table className="eden-table">
              <thead>
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
                    <tr key={r.num} style={{ cursor: 'default', background: isSubmitted ? (isCorrect ? '#f0fdf4' : '#fef2f2') : undefined }}>
                      <td className="text-center">{r.num}</td>
                      <td className="text-center">{isSubmitted ? r.answer : '-'}</td>
                      <td className="text-center">{isSubmitted ? r.resultAnswer : '-'}</td>
                      <td className="text-center">
                        {isSubmitted ? (
                          isCorrect ? <span className="eden-badge eden-badge-success">O</span> : <span className="eden-badge eden-badge-danger">X</span>
                        ) : '-'}
                      </td>
                      <td className="text-center">
                        {!isSubmitted && (
                          <select name={`answer_${r.num}`} className="form-control form-control-sm" defaultValue="" style={{ width: 80, display: 'inline-block' }}>
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
              <div style={{ marginTop: 16 }}>
                <button type="submit" className="eden-btn eden-btn-primary">제출</button>
              </div>
            )}
          </form>
        </div>
      </div>

      <a href="/test" className="eden-btn eden-btn-secondary">
        <i className="fas fa-list"></i> 목록
      </a>
    </div>
  );
}
