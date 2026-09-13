import { Suspense } from 'react';
import { requireAdminSession } from '@/lib/admin-session';
import { searchPrevTests, type PrevTestSearchParams } from '@/lib/prev-test-search';
import DashboardFilters from './DashboardFilters';
import ResultTable from './ResultTable';

export default async function PrevTestDashboardPage({
  searchParams,
}: {
  searchParams: Promise<PrevTestSearchParams>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const { region, testList, schools, publishers, years } = await searchPrevTests(params);

  return (
    <div>
      <h4 className="mb-3">{region === '부천' ? '부천지역 기출' : '타학교 기출'}</h4>

      {/* 필터 (Client Component) */}
      <Suspense fallback={null}>
        <DashboardFilters
          years={years}
          publishers={publishers}
          schools={schools}
          region={region}
        />
      </Suspense>

      {/* 테이블 */}
      <ResultTable testList={testList} />
    </div>
  );
}
