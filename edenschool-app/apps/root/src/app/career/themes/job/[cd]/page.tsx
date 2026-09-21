import { notFound } from 'next/navigation';
import { CareerShell, CareerError, Bar } from '@/components/career/CareerShell';
import { SaveToPortfolio } from '@/components/career/SaveToPortfolio';
import { getJob, cleanText } from '@/lib/careernet/client';

/** 직업 카드: 하는 일·되는 길·전망·관련 영상. 국어 역량 리포트(2)로 이어진다. */
export default async function JobCardPage({ params }: { params: Promise<{ cd: string }> }) {
  const { cd } = await params;
  if (!/^\d+$/.test(cd)) notFound();

  let job;
  try {
    job = await getJob(cd);
  } catch (e) {
    return (
      <CareerShell title="테마별 직업 둘러보기">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  if (!job || !job.baseInfo) notFound();
  const base = job.baseInfo;

  const indicators = job.indicatorChart[0]
    ? job.indicatorChart[0].indicator.split(',').map((name, i) => ({ name, value: Number(job.indicatorChart[0].indicator_data.split(',')[i]) }))
    : [];

  return (
    <CareerShell title="테마별 직업 둘러보기">
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-briefcase"></i> {base.job_nm}
          {base.aptit_name && <span className="eden-badge eden-badge-info">{base.aptit_name}</span>}
          <span style={{ marginLeft: 'auto' }}>
            <SaveToPortfolio kind="job" refId={cd} title={base.job_nm} label="관심 직업으로 저장" />
          </span>
        </div>
        <div className="eden-card-body">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <a href={`/career/job-report/${cd}`} className="eden-btn eden-btn-primary">
              <i className="fas fa-chart-bar"></i> 국어 역량 리포트 보기
            </a>
            <a href={`/career/assessment-topics/${cd}`} className="eden-btn eden-btn-secondary">
              <i className="fas fa-pen-fancy"></i> 수행평가 주제
            </a>
          </div>
          <table className="career-stat-table">
            <tbody>
              {base.wage && (
                <tr>
                  <th>평균 연봉</th>
                  <td>{base.wage}만원 {base.wage_source && <span style={{ color: '#94a3b8' }}>· {cleanText(base.wage_source).split('(자료')[0]}</span>}</td>
                </tr>
              )}
              {base.satisfication !== undefined && (
                <tr>
                  <th>직업 만족도</th>
                  <td>{base.satisfication}%</td>
                </tr>
              )}
              {base.wlb && (
                <tr>
                  <th>일·가정 균형</th>
                  <td>{base.wlb}</td>
                </tr>
              )}
              {base.social && (
                <tr>
                  <th>사회 공헌</th>
                  <td>{base.social}</td>
                </tr>
              )}
              {base.rel_job_nm && (
                <tr>
                  <th>관련 직업</th>
                  <td>{base.rel_job_nm}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="career-grid-2">
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-tasks"></i> 하는 일
          </div>
          <div className="eden-card-body">
            <ul className="career-list">
              {job.workList.map((w, i) => (
                <li key={i}>{cleanText(w.work)}</li>
              ))}
            </ul>
            {job.interestList.length > 0 && (
              <>
                <div className="career-section-title career-mt">이런 사람에게 맞아요</div>
                <ul className="career-list">
                  {job.interestList.map((w, i) => (
                    <li key={i}>{cleanText(w.interest)}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-road"></i> 되는 길
          </div>
          <div className="eden-card-body">
            {job.jobReadyList.curriculum.length > 0 && (
              <>
                <div className="career-section-title">교육 과정</div>
                <ul className="career-list">
                  {job.jobReadyList.curriculum.map((c, i) => (
                    <li key={i}>{cleanText(c.curriculum)}</li>
                  ))}
                </ul>
              </>
            )}
            {job.jobReadyList.certificate.length > 0 && (
              <>
                <div className="career-section-title career-mt">자격</div>
                <ul className="career-list">
                  {job.jobReadyList.certificate.map((c, i) => (
                    <li key={i}>{cleanText(c.certificate)}</li>
                  ))}
                </ul>
              </>
            )}
            {job.departList.length > 0 && (
              <>
                <div className="career-section-title career-mt">관련 학과</div>
                <div>
                  {job.departList.map((d) => (
                    <a key={d.depart_id} href={`/career/major-subjects/${d.depart_id}`} className="career-chip">
                      {d.depart_name}
                    </a>
                  ))}
                </div>
              </>
            )}
            {job.forecastList.length > 0 && (
              <>
                <div className="career-section-title career-mt">전망</div>
                {job.forecastList.map((f, i) => (
                  <p key={i} className="career-text" style={{ fontSize: 13 }}>
                    {cleanText(f.forecast)}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {indicators.length > 0 && (
        <div className="eden-card career-mt">
          <div className="eden-card-header">
            <i className="fas fa-chart-pie"></i> 직업 지표
          </div>
          <div className="eden-card-body">
            {indicators.map((x) => (
              <Bar key={x.name} label={x.name} value={x.value} />
            ))}
          </div>
        </div>
      )}

      {job.relVideoList.length > 0 && (
        <div className="eden-card career-mt">
          <div className="eden-card-header">
            <i className="fas fa-video"></i> 관련 영상
          </div>
          <div className="eden-card-body">
            <div className="career-grid-2">
              {job.relVideoList.map((v) => (
                <div key={v.video_id}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{v.video_name}</div>
                  <video controls preload="none" src={v.OUTPATH3} style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                </div>
              ))}
            </div>
            <div className="career-note">영상 출처: 커리어넷</div>
          </div>
        </div>
      )}

      {job.jobRelOrgList.length > 0 && (
        <div className="career-note">
          <strong>관련 기관</strong>{' '}
          {job.jobRelOrgList.map((o, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              <a href={o.rel_org_url} target="_blank" rel="noopener noreferrer">
                {o.rel_org}
              </a>
            </span>
          ))}
        </div>
      )}
    </CareerShell>
  );
}
