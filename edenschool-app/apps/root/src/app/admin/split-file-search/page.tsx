import { Suspense } from 'react';
import { requireAdminSession } from '@/lib/admin-session';
import {
  searchSplitFiles,
  selectSplitFileDistinctGrades,
} from '@edenschool/common/queries/split-file';
import SearchFilters from './SearchFilters';
import ResultTable from './ResultTable';

export default async function SplitFileSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    keyword?: string;
    grade?: string;
    page?: string;
  }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const keyword = params.keyword || '';
  const selectedGrades = params.grade?.split(',').filter(Boolean) || [];
  const page = Number(params.page) || 1;
  const pageSize = 50;

  const result = await searchSplitFiles({
    keyword,
    grade: selectedGrades,
    page,
    pageSize,
  });

  const grades = await selectSplitFileDistinctGrades();

  const totalPages = Math.ceil(result.total / pageSize);

  // 페이지네이션 URL 생성
  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (keyword) sp.set('keyword', keyword);
    if (selectedGrades.length) sp.set('grade', selectedGrades.join(','));
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/admin/split-file-search${qs ? '?' + qs : ''}`;
  }

  return (
    <div>
      <h4 className="mb-3">쪼개기 파일 검색</h4>

      <Suspense fallback={null}>
        <SearchFilters grades={grades} />
      </Suspense>

      {/* 결과 테이블 */}
      <ResultTable list={result.list} keyword={keyword} />

      <div className="d-flex justify-content-between align-items-center">
        <p className="text-muted mb-0">
          총 {result.total}건 (페이지 {page}/{totalPages || 1})
        </p>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
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
                  <li
                    key={p}
                    className={`page-item ${p === page ? 'active' : ''}`}
                  >
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
        )}
      </div>
    </div>
  );
}
