import { notFound } from 'next/navigation';
import { CareerShell, CareerError, Bar } from '@/components/career/CareerShell';
import { SaveToPortfolio } from '@/components/career/SaveToPortfolio';
import { getJob, cleanText } from '@/lib/careernet/client';
import { LANGUAGE_PERFORMS, KOREAN_KNOWLEDGE } from '@/lib/careernet/content';

export default async function JobReportDetailPage({ params }: { params: Promise<{ cd: string }> }) {
  const { cd } = await params;
  if (!/^\d+$/.test(cd)) notFound();

  let job;
  try {
    job = await getJob(cd);
  } catch (e) {
    return (
      <CareerShell title="직업별 국어 역량 리포트">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  if (!job || !job.baseInfo) notFound();

  const base = job.baseInfo;
  const korean = job.performList.knowledge.find((k) => k.knowledge === KOREAN_KNOWLEDGE);
  const langPerforms = job.performList.perform.filter((p) => LANGUAGE_PERFORMS.includes(p.perform));
  const otherKnowledge = job.performList.knowledge.filter((k) => k.knowledge !== KOREAN_KNOWLEDGE);
  const source = korean?.source || job.performList.knowledge[0]?.source || job.performList.perform[0]?.source || '';

  // 국어 역량을 키우는 공부 안내 — 어떤 언어 능력이 높은지에 따라 문구를 고른다.
  const tips: string[] = [];
  if (langPerforms.some((p) => p.perform === '글쓰기')) tips.push('보고서·논설문 쓰기 훈련 (독서와 작문, 직무 의사소통)');
  if (langPerforms.some((p) => p.perform === '읽고 이해하기')) tips.push('비문학 지문 구조 독해와 요약 (독서와 작문, 주제 탐구 독서)');
  if (langPerforms.some((p) => ['말하기', '설득', '협상', '가르치기'].includes(p.perform))) tips.push('발표·토론·면접 말하기 연습 (화법과 언어, 독서 토론과 글쓰기)');
  if (langPerforms.some((p) => p.perform === '듣고 이해하기')) tips.push('강연·대화 내용 메모하며 핵심 파악하기 (화법과 언어)');
  if (langPerforms.some((p) => ['논리적 분석', '판단과 의사결정'].includes(p.perform))) tips.push('논증 구조 분석과 근거 평가 (독서 토론과 글쓰기)');
  if (tips.length === 0) tips.push('모든 직업의 기본인 읽기·쓰기·말하기 균형 훈련 (일반 선택 국어 과목)');

  return (
    <CareerShell title="직업별 국어 역량 리포트">
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-briefcase"></i> {base.job_nm}
          {base.aptit_name && <span className="eden-badge eden-badge-info">{base.aptit_name}</span>}
          <span style={{ marginLeft: 'auto' }}>
            <SaveToPortfolio kind="job" refId={cd} title={base.job_nm} label="관심 직업으로 저장" />
          </span>
        </div>
        <div className="eden-card-body">
          {job.workList[0] && <p className="career-text">{cleanText(job.workList[0].work)}</p>}
          {base.rel_job_nm && (
            <div className="career-note">
              <strong>관련 직업</strong> {base.rel_job_nm}
            </div>
          )}
        </div>
      </div>

      <div className="career-grid-2">
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-book"></i> 국어 지식 중요도
          </div>
          <div className="eden-card-body">
            {korean ? (
              <>
                <Bar label="국어" value={korean.importance} accent hint={korean.inform} />
                <div className="career-note" style={{ marginTop: 6 }}>{korean.inform}</div>
              </>
            ) : (
              <div className="career-note" style={{ marginTop: 0 }}>
                이 직업 자료의 지식 상위 10개 항목에는 '국어'가 포함되어 있지 않습니다. (커리어넷은 직업별로 상위 10개 지식만 제공합니다.)
              </div>
            )}
            {otherKnowledge.length > 0 && (
              <>
                <div className="career-section-title career-mt">이 직업에서 중요한 다른 지식</div>
                {otherKnowledge.slice(0, 6).map((k) => (
                  <Bar key={k.knowledge} label={k.knowledge} value={k.importance} hint={k.inform} />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-comment-dots"></i> 언어 관련 업무수행능력
          </div>
          <div className="eden-card-body">
            {langPerforms.length > 0 ? (
              langPerforms.map((p) => <Bar key={p.perform} label={p.perform} value={p.importance} accent hint={p.inform} />)
            ) : (
              <div className="career-note" style={{ marginTop: 0 }}>
                이 직업 자료의 업무수행능력 상위 10개 항목에는 언어 관련 항목(글쓰기·읽고 이해하기·말하기 등)이 없습니다.
              </div>
            )}
            {job.performList.perform.length > 0 && (
              <>
                <div className="career-section-title career-mt">업무수행능력 전체 (상위 10개)</div>
                {job.performList.perform.map((p) => (
                  <Bar key={p.perform} label={p.perform} value={p.importance} hint={p.inform} accent={LANGUAGE_PERFORMS.includes(p.perform)} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {job.abilityList.length > 0 && (
        <div className="career-note">
          <strong>핵심 능력</strong> {job.abilityList.map((a) => a.ability_name).join(', ')}
          {job.aptitudeList[0] && <div style={{ marginTop: 4 }}>{cleanText(job.aptitudeList[0].aptitude)}</div>}
        </div>
      )}
      {source && <div className="career-note">{source}</div>}

      <div className="career-eden-box career-mt">
        <strong>이 역량을 키우는 국어 공부</strong>
        <ul className="career-list" style={{ marginTop: 6 }}>
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      {job.departList.length > 0 && (
        <div className="eden-card career-mt">
          <div className="eden-card-header">
            <i className="fas fa-graduation-cap"></i> 관련 학과의 국어 선택과목
          </div>
          <div className="eden-card-body">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {job.departList.map((d) => (
                <a key={d.depart_id} href={`/career/major-subjects/${d.depart_id}`} className="eden-btn eden-btn-secondary eden-btn-sm">
                  <i className="fas fa-book-open"></i> {d.depart_name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="career-mt" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={`/career/assessment-topics/${cd}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-pen-fancy"></i> 이 직업으로 수행평가 주제 만들기
        </a>
        <a href={`/career/themes/job/${cd}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-info-circle"></i> 직업 상세 정보
        </a>
        <a href="/career/job-report" className="eden-btn eden-btn-secondary">
          <i className="fas fa-search"></i> 다른 직업 검색
        </a>
      </div>
    </CareerShell>
  );
}
