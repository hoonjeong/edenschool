import { searchJobs, type JobListItem } from '@/lib/careernet/client';
import { CareerError } from './CareerShell';

/**
 * 직업 검색 폼 + 결과 목록 (서버 컴포넌트).
 * 국어 역량 리포트(2), 수행평가 주제 은행(4)이 공유한다. 결과 링크는 `${basePath}/${job_cd}`.
 */
export async function JobSearch({ action, basePath, q, hint, page = 1 }: { action: string; basePath: string; q?: string; hint?: string; page?: number }) {
  const hasQuery = !!q?.trim();

  let result: { count: number; pageSize: number; pageIndex: number; jobs: JobListItem[] } | null = null;
  let error: unknown = null;
  if (hasQuery) {
    try {
      result = await searchJobs({ q, page });
    } catch (e) {
      error = e;
    }
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.count / (result.pageSize || 10))) : 1;

  return (
    <>
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-body">
          <form action={action} method="GET">
            <div className="eden-input-row">
              <input type="text" name="q" defaultValue={q} placeholder="직업명을 입력하세요 (예: 간호사, 변호사, 기자)" />
              <button type="submit" className="eden-btn eden-btn-primary">
                <i className="fas fa-search"></i> 검색
              </button>
            </div>
          </form>
          {hint && <div className="career-note">{hint}</div>}
        </div>
      </div>

      {error !== null && <CareerError error={error} />}

      {!hasQuery && (
        <div className="eden-empty">
          <i className="fas fa-briefcase"></i>
          직업명을 검색하세요. 관심 분야에서 찾고 싶다면 <a href="/career/themes">테마별 직업 둘러보기</a>를 이용하세요.
        </div>
      )}

      {result && result.jobs.length === 0 && (
        <div className="eden-empty">
          <i className="fas fa-search"></i>
          검색 결과가 없습니다. 다른 이름으로 검색해 보세요.
        </div>
      )}

      {result && result.jobs.length > 0 && (
        <>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
            총 {result.count}건 · {result.pageIndex}/{totalPages} 페이지
          </div>
          <JobList jobs={result.jobs} basePath={basePath} />
          {totalPages > 1 && (
            <nav className="eden-pagination" style={{ marginTop: 16 }}>
              {page > 1 && (
                <a className="eden-btn eden-btn-secondary eden-btn-sm" href={`${action}?q=${encodeURIComponent(q!)}&page=${page - 1}`}>
                  이전
                </a>
              )}
              <span style={{ fontSize: 13, padding: '0 8px' }}>
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <a className="eden-btn eden-btn-secondary eden-btn-sm" href={`${action}?q=${encodeURIComponent(q!)}&page=${page + 1}`}>
                  다음
                </a>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}

export function JobList({ jobs, basePath }: { jobs: JobListItem[]; basePath: string }) {
  return (
    <>
      {jobs.map((j) => (
        <a key={j.job_cd} href={`${basePath}/${j.job_cd}`} className="career-result">
          <div className="career-result-title">
            {j.job_nm}
            {j.top_nm && <span className="eden-badge eden-badge-info">{j.top_nm}</span>}
            {j.wage && <span className="eden-badge" style={{ background: '#f1f5f9', color: '#475569' }}>연봉 {j.wage}</span>}
          </div>
          <div className="career-result-sub">{j.work}</div>
        </a>
      ))}
    </>
  );
}
