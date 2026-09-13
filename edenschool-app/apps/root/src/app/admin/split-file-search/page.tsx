import { Suspense } from 'react';
import { requireAdminSession } from '@/lib/admin-session';
import {
  searchSplitFiles,
  selectSplitFileDistinctGrades,
} from '@edenschool/common/queries/split-file';
import SearchFilters from './SearchFilters';
import ResultTable from './ResultTable';
import Pagination, { buildPageUrl } from './Pagination';

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
  const pageUrl = buildPageUrl('/admin/split-file-search', keyword, selectedGrades);

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
        <Pagination page={page} totalPages={totalPages} pageUrl={pageUrl} />
      </div>
    </div>
  );
}
