import { notFound } from 'next/navigation';
import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { JobList } from '@/components/career/JobSearch';
import { searchJobs } from '@/lib/careernet/client';
import { JOB_THEMES, KOREAN_LOVER_APTDS } from '@/lib/careernet/content';

export default async function ThemeJobsPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ page?: string }> }) {
  const { code } = await params;
  const { page } = await searchParams;
  const pageNo = Math.max(1, parseInt(page || '1', 10) || 1);

  const isKorean = code === 'korean';
  const theme = JOB_THEMES.find((t) => t.code === code);
  if (!isKorean && !theme) notFound();

  const title = isKorean ? '국어를 좋아하는 학생을 위한 직업' : `${theme!.name} 테마 직업`;

  let result;
  try {
    result = isKorean ? await searchJobs({ aptd: KOREAN_LOVER_APTDS.map((a) => a.code).join(','), page: pageNo }) : await searchJobs({ theme: code, page: pageNo });
  } catch (e) {
    return (
      <CareerShell title="테마별 직업 둘러보기">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  const totalPages = Math.max(1, Math.ceil(result.count / (result.pageSize || 10)));
  const base = `/career/themes/${code}`;

  return (
    <CareerShell title="테마별 직업 둘러보기">
      <div className="career-section-title" style={{ marginBottom: 12 }}>
        <i className={`fas ${isKorean ? 'fa-star' : theme!.icon}`}></i> {title}
        <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>총 {result.count}개</span>
      </div>
      {isKorean && (
        <div className="career-note" style={{ marginTop: 0, marginBottom: 14 }}>
          적성유형 {KOREAN_LOVER_APTDS.map((a) => a.name).join(' · ')} 에 속한 직업입니다. 직업을 누르면 하는 일·전망·영상과 함께 국어 역량 리포트로 이어집니다.
        </div>
      )}
      {result.jobs.length === 0 ? <div className="eden-empty">직업이 없습니다.</div> : <JobList jobs={result.jobs} basePath="/career/themes/job" />}
      {totalPages > 1 && (
        <nav className="eden-pagination" style={{ marginTop: 16 }}>
          {pageNo > 1 && (
            <a className="eden-btn eden-btn-secondary eden-btn-sm" href={`${base}?page=${pageNo - 1}`}>
              이전
            </a>
          )}
          <span style={{ fontSize: 13, padding: '0 8px' }}>
            {pageNo} / {totalPages}
          </span>
          {pageNo < totalPages && (
            <a className="eden-btn eden-btn-secondary eden-btn-sm" href={`${base}?page=${pageNo + 1}`}>
              다음
            </a>
          )}
        </nav>
      )}
      <div className="career-mt">
        <a href="/career/themes" className="eden-btn eden-btn-secondary">
          <i className="fas fa-th-large"></i> 다른 테마 보기
        </a>
      </div>
    </CareerShell>
  );
}
