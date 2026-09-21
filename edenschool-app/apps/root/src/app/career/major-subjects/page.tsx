import { CareerShell } from '@/components/career/CareerShell';
import { MajorSearch } from '@/components/career/MajorSearch';

export default async function MajorSubjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; subject?: string }> }) {
  const { q, subject } = await searchParams;
  return (
    <CareerShell title="학과별 국어 선택과목 가이드" desc="고교학점제에서 희망 학과에 맞는 국어 선택과목을 확인하세요.">
      <MajorSearch
        action="/career/major-subjects"
        basePath="/career/major-subjects"
        q={q}
        subject={subject}
        hint="학과를 고르면 2022 개정 교육과정 기준 권장 선택과목이 일반·진로·융합 선택으로 나뉘어 표시되고, 국어 과목은 주황색으로 강조됩니다."
      />
    </CareerShell>
  );
}
