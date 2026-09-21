import { CareerShell } from '@/components/career/CareerShell';
import { MajorSearch } from '@/components/career/MajorSearch';

export default async function ReadingGuidePage({ searchParams }: { searchParams: Promise<{ q?: string; subject?: string }> }) {
  const { q, subject } = await searchParams;
  return (
    <CareerShell title="진로 연계 주제 탐구 독서 가이드" desc="희망 학과에서 배우는 내용과 진로 탐색 활동을 보고, 탐구 독서 방향을 잡아 보세요.">
      <MajorSearch
        action="/career/reading-guide"
        basePath="/career/reading-guide"
        q={q}
        subject={subject}
        hint="'주제 탐구 독서' 과목과 독서 관련 수행평가 준비에 활용할 수 있습니다."
      />
    </CareerShell>
  );
}
