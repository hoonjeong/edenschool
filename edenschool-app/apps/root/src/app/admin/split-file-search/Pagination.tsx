/**
 * 쪼개기 파일 목록 페이지네이션 (서버 컴포넌트, 일반 링크)
 * 검색 페이지와 관리 페이지(/admin/split-file-add)에서 공용으로 사용한다.
 */
export default function Pagination({
  page,
  totalPages,
  pageUrl,
}: {
  page: number;
  totalPages: number;
  pageUrl: (p: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav>
      <ul className="pagination pagination-sm mb-0">
        {page > 1 && (
          <li className="page-item">
            <a className="page-link" href={pageUrl(page - 1)}>
              이전
            </a>
          </li>
        )}
        {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
          let p: number;
          if (totalPages <= 10) {
            p = i + 1;
          } else {
            const start = Math.max(1, Math.min(page - 4, totalPages - 9));
            p = start + i;
          }
          return (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <a className="page-link" href={pageUrl(p)}>
                {p}
              </a>
            </li>
          );
        })}
        {page < totalPages && (
          <li className="page-item">
            <a className="page-link" href={pageUrl(page + 1)}>
              다음
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}

/** 검색 조건을 유지한 페이지 URL 생성기 */
export function buildPageUrl(basePath: string, keyword: string, grades: string[]) {
  return (p: number) => {
    const sp = new URLSearchParams();
    if (keyword) sp.set('keyword', keyword);
    if (grades.length) sp.set('grade', grades.join(','));
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? '?' + qs : ''}`;
  };
}
