import { Suspense } from 'react';
import { requireAdminSession } from '@/lib/admin-session';
import {
  searchMockFull,
  selectMockFullGrades,
  selectMockFullYears,
  selectMockFullMonths,
} from '@edenschool/common/queries/mock-test';
import MockFullFilters from './MockFullFilters';
import MockFullResultTable from './MockFullResultTable';

export default async function MockFullSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; year?: string; month?: string; page?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const grade = params.grade?.split(',').filter(Boolean) || [];
  const year = params.year?.split(',').filter(Boolean) || [];
  const month = params.month?.split(',').filter(Boolean) || [];
  const page = Number(params.page) || 1;
  const pageSize = 50;

  const result = await searchMockFull({ grade, year, month, page, pageSize });
  const [grades, years, months] = await Promise.all([
    selectMockFullGrades(),
    selectMockFullYears(),
    selectMockFullMonths(),
  ]);

  const totalPages = Math.ceil(result.total / pageSize);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (grade.length) sp.set('grade', grade.join(','));
    if (year.length) sp.set('year', year.join(','));
    if (month.length) sp.set('month', month.join(','));
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/admin/mock-full-search${qs ? '?' + qs : ''}`;
  }

  return (
    <div>
      <h4 className="mb-3">풀세트 모의고사 검색</h4>

      <Suspense fallback={null}>
        <MockFullFilters grades={grades} years={years} months={months} />
      </Suspense>

      <MockFullResultTable list={result.list} />

      <div className="d-flex justify-content-between align-items-center">
        <p className="text-muted mb-0">총 {result.total}건 (페이지 {page}/{totalPages || 1})</p>
        {totalPages > 1 && (
          <nav>
            <ul className="pagination pagination-sm mb-0">
              {page > 1 && (
                <li className="page-item"><a className="page-link" href={pageUrl(page - 1)}>이전</a></li>
              )}
              {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                const start = totalPages <= 10 ? 1 : Math.max(1, Math.min(page - 4, totalPages - 9));
                const p = start + i;
                return (
                  <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <a className="page-link" href={pageUrl(p)}>{p}</a>
                  </li>
                );
              })}
              {page < totalPages && (
                <li className="page-item"><a className="page-link" href={pageUrl(page + 1)}>다음</a></li>
              )}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
