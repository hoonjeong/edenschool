import { CareerShell } from '@/components/career/CareerShell';
import { JobSearch } from '@/components/career/JobSearch';

export default async function JobReportPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  const pageNo = Math.max(1, parseInt(page || '1', 10) || 1);
  return (
    <CareerShell title="직업별 국어 역량 리포트" desc="희망 직업에서 국어 지식과 언어 능력이 얼마나 중요한지 수치로 확인하세요.">
      <JobSearch
        action="/career/job-report"
        basePath="/career/job-report"
        q={q}
        page={pageNo}
        hint="직업을 고르면 '국어' 지식 중요도와 글쓰기·읽고 이해하기·말하기 등 언어 관련 업무수행능력 점수가 막대그래프로 표시됩니다."
      />
    </CareerShell>
  );
}
