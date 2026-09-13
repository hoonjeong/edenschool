import { Suspense } from 'react';
import { requireAdminSession } from '@/lib/admin-session';
import { searchPrevTests, type PrevTestSearchParams } from '@/lib/prev-test-search';
import DashboardFilters from '../prev-test-dashboard/DashboardFilters';
import ResultTable from '../prev-test-dashboard/ResultTable';
import { PrevTestAddForm } from './PrevTestAddForm';

/**
 * 내신 기출관리 (원장 메뉴): 상단은 추가/수정 폼,
 * 하단은 기출 대시보드와 동일한 검색·필터·목록에 수정/삭제 기능을 더한 관리 목록.
 */
export default async function PrevTestAddPage({
  searchParams,
}: {
  searchParams: Promise<PrevTestSearchParams & { metaId?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const { region, testList, schools, publishers, years } = await searchPrevTests(params);
  const managePath = `/admin/prev-test-add?region=${encodeURIComponent(region)}`;

  return (
    <div>
      <PrevTestAddForm />

      <hr className="my-4" />

      {/* ── 등록된 기출 검색 / 관리 ── */}
      <h4 className="mb-3">
        {region === '부천' ? '부천지역' : '타지역'} 기출 관리
        <span className="text-muted ml-2" style={{ fontSize: '13px', fontWeight: 400 }}>
          목록에서 수정·삭제할 수 있습니다
        </span>
      </h4>

      <Suspense fallback={null}>
        <DashboardFilters
          years={years}
          publishers={publishers}
          schools={schools}
          region={region}
          basePath="/admin/prev-test-add"
        />
      </Suspense>

      <ResultTable testList={testList} manageBasePath={managePath} />
    </div>
  );
}
