import { pagePath } from '@/lib/board';

/**
 * 목록 페이지네이션 (일반 게시판 + 질문게시판 공용).
 * 링크는 basePath 와 basePath?page=N 형태로만 만들어(중복 URL 방지)
 * 각 페이지가 자기 자신을 canonical 로 갖도록 한다.
 */
export function BoardPagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  // 현재 페이지 주변 5개만 노출 (글이 많아져도 링크가 폭발하지 않게)
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="eden-pagination" aria-label="게시판 페이지" style={{ marginTop: 16, textAlign: 'center' }}>
      {page > 1 && (
        <a href={pagePath(basePath, page - 1)} className="eden-btn eden-btn-secondary eden-btn-sm" rel="prev">
          이전
        </a>
      )}
      {pages.map((p) =>
        p === page ? (
          <span key={p} className="eden-btn eden-btn-primary eden-btn-sm" aria-current="page">
            {p}
          </span>
        ) : (
          <a key={p} href={pagePath(basePath, p)} className="eden-btn eden-btn-secondary eden-btn-sm">
            {p}
          </a>
        ),
      )}
      {page < totalPages && (
        <a href={pagePath(basePath, page + 1)} className="eden-btn eden-btn-secondary eden-btn-sm" rel="next">
          다음
        </a>
      )}
    </nav>
  );
}
