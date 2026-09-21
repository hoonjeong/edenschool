import { notFound } from 'next/navigation';
import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { getJob, cleanText } from '@/lib/careernet/client';
import { ASSESSMENT_TYPES } from '@/lib/careernet/content';

export default async function AssessmentTopicsDetailPage({ params, searchParams }: { params: Promise<{ cd: string }>; searchParams: Promise<{ type?: string }> }) {
  const { cd } = await params;
  const { type } = await searchParams;
  if (!/^\d+$/.test(cd)) notFound();

  let job;
  try {
    job = await getJob(cd);
  } catch (e) {
    return (
      <CareerShell title="진로 연계 수행평가 주제 은행">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  if (!job || !job.baseInfo) notFound();

  const jobName = job.baseInfo.job_nm;
  const selected = ASSESSMENT_TYPES.find((t) => t.key === type) ?? ASSESSMENT_TYPES[0];
  const fill = (s: string) => s.replace(/\{job\}/g, jobName);

  return (
    <CareerShell title="진로 연계 수행평가 주제 은행">
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-briefcase"></i> {jobName}
          {job.baseInfo.aptit_name && <span className="eden-badge eden-badge-info">{job.baseInfo.aptit_name}</span>}
        </div>
        <div className="eden-card-body">
          <div className="career-section-title">수행평가 유형 선택</div>
          <div className="eden-tabs" style={{ marginBottom: 0 }}>
            {ASSESSMENT_TYPES.map((t) => (
              <a key={t.key} href={`/career/assessment-topics/${cd}?type=${t.key}`} className={`eden-tab${t.key === selected.key ? ' active' : ''}`}>
                {t.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="career-grid-2">
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-lightbulb"></i> {selected.name} 주제 예시
            <span className="eden-badge eden-badge-info">{selected.subject}</span>
          </div>
          <div className="eden-card-body">
            <ol className="career-list">
              {selected.topics.map((t) => (
                <li key={t}>{fill(t)}</li>
              ))}
            </ol>
            <div className="career-section-title career-mt">구성 틀</div>
            <ol className="career-list">
              {selected.frame.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ol>
            <div className="career-note">
              주제 문장과 구성 틀은 이든배움 기본 틀입니다. 학교별 전담 선생님이 담당 학교의 수행평가 경향에 맞춰 함께 다듬습니다.
            </div>
          </div>
        </div>

        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-file-alt"></i> 근거 자료 (커리어넷)
          </div>
          <div className="eden-card-body">
            {job.workList.length > 0 && (
              <>
                <div className="career-section-title">하는 일</div>
                <ul className="career-list">
                  {job.workList.map((w, i) => (
                    <li key={i}>{cleanText(w.work)}</li>
                  ))}
                </ul>
              </>
            )}
            {job.forecastList.length > 0 && (
              <>
                <div className="career-section-title career-mt">직업 전망</div>
                {job.forecastList.map((f, i) => (
                  <p key={i} className="career-text" style={{ fontSize: 13 }}>
                    {cleanText(f.forecast)}
                  </p>
                ))}
              </>
            )}
            {job.baseInfo.wage_source && (
              <>
                <div className="career-section-title career-mt">평균 연봉</div>
                <p className="career-text" style={{ fontSize: 13 }}>{cleanText(job.baseInfo.wage_source)}</p>
              </>
            )}
            {job.baseInfo.satisfi_source && (
              <>
                <div className="career-section-title career-mt">직업 만족도</div>
                <p className="career-text" style={{ fontSize: 13 }}>{cleanText(job.baseInfo.satisfi_source)}</p>
              </>
            )}
            {job.tagList.length > 0 && (
              <div className="career-note">
                <strong>관련 태그</strong> {job.tagList.map((t) => `#${t}`).join(' ')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="career-eden-box career-mt">
        <strong>인용 방법</strong> — 근거 자료를 글이나 발표에 쓸 때는 "커리어넷 직업백과, {jobName}" 처럼 출처를 밝히세요. 자료 안의 "(자료: 워크넷 …)" 표기도 함께 옮겨 적으면 신뢰도가 높아집니다.
      </div>

      <div className="career-mt" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={`/career/job-report/${cd}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-chart-bar"></i> 이 직업의 국어 역량 리포트
        </a>
        <a href="/career/assessment-topics" className="eden-btn eden-btn-secondary">
          <i className="fas fa-search"></i> 다른 직업 검색
        </a>
      </div>
    </CareerShell>
  );
}
