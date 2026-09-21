import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { SummaryForm } from '@/components/career/SummaryForm';
import { searchJobs, getJob, cleanText } from '@/lib/careernet/client';

/**
 * 오늘의 직업: 날짜에서 결정론적으로 직업 하나를 고른다.
 * 직업분류(0~9) 를 날짜로 돌리고, 그 분류의 목록에서 페이지·항목을 날짜로 고른다.
 * 같은 날엔 누구나 같은 직업을 보고, 캐시(1주)도 그대로 탄다.
 */
function todayKey(): { key: string; dayIndex: number } {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST
  const key = now.toISOString().slice(0, 10);
  const dayIndex = Math.floor(now.getTime() / 86400000);
  return { key, dayIndex };
}

async function pickTodayJob(dayIndex: number) {
  const jobCd = String(dayIndex % 10);
  const first = await searchJobs({ jobCd, page: 1 });
  const pages = Math.max(1, Math.ceil(first.count / (first.pageSize || 10)));
  const page = (Math.floor(dayIndex / 10) % pages) + 1;
  const list = page === 1 ? first : await searchJobs({ jobCd, page });
  const jobs = list.jobs.length > 0 ? list.jobs : first.jobs;
  if (jobs.length === 0) return null;
  return jobs[dayIndex % jobs.length];
}

export default async function TodayJobPage() {
  const { key, dayIndex } = todayKey();

  let job;
  let detail;
  try {
    job = await pickTodayJob(dayIndex);
    if (job) detail = await getJob(job.job_cd);
  } catch (e) {
    return (
      <CareerShell title="오늘의 직업 읽기">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  if (!job || !detail?.baseInfo) {
    return (
      <CareerShell title="오늘의 직업 읽기">
        <div className="eden-empty">오늘의 직업을 불러오지 못했습니다.</div>
      </CareerShell>
    );
  }

  const paragraphs = detail.workList.map((w) => cleanText(w.work)).filter(Boolean);
  const cd = String(job.job_cd);

  return (
    <CareerShell title="오늘의 직업 읽기" desc="진로 정보를 읽고 핵심 내용을 한 문장으로 요약하는 비문학 훈련입니다.">
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-calendar-day"></i> {key} 오늘의 직업 — {job.job_nm}
          {job.top_nm && <span className="eden-badge eden-badge-info">{job.top_nm}</span>}
        </div>
        <div className="eden-card-body">
          <div className="career-section-title">설명문</div>
          {paragraphs.length === 0 ? (
            <div className="career-note" style={{ marginTop: 0 }}>{cleanText(job.work)}</div>
          ) : (
            paragraphs.map((p, i) => (
              <p key={i} className="career-text">
                {p}
              </p>
            ))
          )}
          <div className="career-note">출처: 커리어넷 직업백과 「{job.job_nm}」 (하는 일)</div>
        </div>
      </div>

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-pen"></i> 한 문장 요약
        </div>
        <div className="eden-card-body">
          <div className="career-note" style={{ marginTop: 0, marginBottom: 12 }}>
            <strong>요약 요령</strong> ① 직업이 '무엇을' 하는지 핵심 동사를 찾는다 ② '누구를 위해 / 어디에서'를 덧붙인다 ③ 세부 예시는 뺀다.
          </div>
          <SummaryForm jobCd={cd} jobName={job.job_nm} dateKey={key} />
        </div>
      </div>

      <div className="career-mt" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={`/career/job-report/${cd}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-chart-bar"></i> 이 직업의 국어 역량 리포트
        </a>
        <a href={`/career/themes/job/${cd}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-info-circle"></i> 직업 상세 정보
        </a>
      </div>
    </CareerShell>
  );
}
