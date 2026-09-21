import { CareerShell } from '@/components/career/CareerShell';
import { JobSearch } from '@/components/career/JobSearch';
import { ASSESSMENT_TYPES } from '@/lib/careernet/content';

export default async function AssessmentTopicsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const pageNo = Math.max(1, parseInt(page || '1', 10) || 1);
  return (
    <CareerShell title="진로 연계 수행평가 주제 은행" desc="희망 직업과 연결된 발표·토론·글쓰기 수행평가 주제와 근거 자료를 제공합니다.">
      <JobSearch
        action="/career/assessment-topics"
        basePath="/career/assessment-topics"
        q={q}
        page={pageNo}
        hint={`직업을 고른 뒤 수행평가 유형(${ASSESSMENT_TYPES.map((t) => t.name).join('·')})을 선택하면 주제 예시와 함께 커리어넷의 직업 전망 자료가 근거 자료로 표시됩니다.`}
      />
    </CareerShell>
  );
}
