import { searchMajors, type MajorListItem } from '@/lib/careernet/client';
import { MAJOR_SUBJECT_CODES } from '@/lib/careernet/content';
import { CareerError } from './CareerShell';

/**
 * 학과 검색 폼 + 결과 목록 (서버 컴포넌트).
 * 학과별 국어 선택과목(1), 독서 가이드(3), 학과 비교(8)가 공유한다.
 * 결과 링크는 `${basePath}/${majorSeq}?cls=계열` 로 간다 (상세 API 에는 계열이 없어 목록에서 넘긴다).
 */
export async function MajorSearch({
  action,
  basePath,
  q,
  subject,
  hint,
  extraQuery,
  hidden,
}: {
  action: string;
  basePath: string;
  q?: string;
  subject?: string;
  hint?: string;
  /** 결과 링크에 그대로 붙일 쿼리 (예: 비교 화면의 상대 학과) */
  extraQuery?: string;
  /** 검색 폼이 유지해야 하는 값 (예: 비교 화면의 첫 학과) */
  hidden?: Record<string, string>;
}) {
  const hasQuery = !!(q?.trim() || subject);

  let results: MajorListItem[] = [];
  let error: unknown = null;
  if (hasQuery) {
    try {
      results = await searchMajors({ q, subject, perPage: 60 });
    } catch (e) {
      error = e;
    }
  }

  return (
    <>
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-body">
          <form action={action} method="GET">
            {Object.entries(hidden ?? {}).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <div className="eden-input-row">
              <select name="subject" defaultValue={subject ?? ''} className="career-select" aria-label="계열">
                <option value="">전체 계열</option>
                {MAJOR_SUBJECT_CODES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input type="text" name="q" defaultValue={q} placeholder="학과명을 입력하세요 (예: 간호, 경영, 컴퓨터)" />
              <button type="submit" className="eden-btn eden-btn-primary">
                <i className="fas fa-search"></i> 검색
              </button>
            </div>
          </form>
          {hint && <div className="career-note">{hint}</div>}
        </div>
      </div>

      {error !== null && <CareerError error={error} />}

      {error === null && hasQuery && results.length === 0 && (
        <div className="eden-empty">
          <i className="fas fa-search"></i>
          검색 결과가 없습니다. 다른 이름으로 검색해 보세요.
        </div>
      )}

      {!hasQuery && (
        <div className="eden-empty">
          <i className="fas fa-graduation-cap"></i>
          학과명을 검색하거나 계열을 선택하세요.
        </div>
      )}

      {results.map((m) => (
        <a key={m.majorSeq} href={`${basePath}/${m.majorSeq}?cls=${encodeURIComponent(m.lClass)}${extraQuery ? `&${extraQuery}` : ''}`} className="career-result">
          <div className="career-result-title">
            {m.mClass}
            <span className="eden-badge eden-badge-info">{m.lClass}</span>
          </div>
          {m.facilName && <div className="career-result-sub">{m.facilName}</div>}
        </a>
      ))}
    </>
  );
}
