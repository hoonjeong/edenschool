import { Suspense } from 'react';
import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import {
  searchSplitFiles,
  selectSplitFileDistinctGrades,
} from '@edenschool/common/queries/split-file';
import SearchFilters from '../split-file-search/SearchFilters';
import ResultTable from '../split-file-search/ResultTable';
import Pagination, { buildPageUrl } from '../split-file-search/Pagination';
import { SplitFileAddForm } from './SplitFileAddForm';

/**
 * 쪼개기 파일 관리 (원장 메뉴): 상단은 추가/수정 폼,
 * 하단은 쪼개기 검색과 동일한 검색·필터·목록에 수정/삭제 기능을 더한 관리 목록.
 */
export default async function SplitFileAddPage({
  searchParams,
}: {
  searchParams: Promise<{
    keyword?: string;
    grade?: string;
    page?: string;
    metaId?: string;
  }>;
}) {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;

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
  const pageUrl = buildPageUrl('/admin/split-file-add', keyword, selectedGrades);

  return (
    <div>
      <SplitFileAddForm />

      <hr className="my-4" />

      {/* ── 등록된 쪼개기 파일 검색 / 관리 ── */}
      <h4 className="mb-3">
        쪼개기 파일 관리
        <span className="text-muted ml-2" style={{ fontSize: '13px', fontWeight: 400 }}>
          목록에서 수정·삭제할 수 있습니다
        </span>
      </h4>

      <Suspense fallback={null}>
        <SearchFilters grades={grades} basePath="/admin/split-file-add" />
      </Suspense>

      <ResultTable list={result.list} keyword={keyword} manageBasePath="/admin/split-file-add" />

      <div className="d-flex justify-content-between align-items-center">
        <p className="text-muted mb-0">
          총 {result.total}건 (페이지 {page}/{totalPages || 1})
        </p>
        <Pagination page={page} totalPages={totalPages} pageUrl={pageUrl} />
      </div>
    </div>
  );
}
