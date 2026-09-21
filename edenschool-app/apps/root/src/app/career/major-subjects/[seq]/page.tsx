import { notFound } from 'next/navigation';
import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { SaveToPortfolio } from '@/components/career/SaveToPortfolio';
import { getMajor, cleanText } from '@/lib/careernet/client';
import { KOREAN_SUBJECTS, isKoreanSubject, findKoreanSubject } from '@/lib/careernet/content';
import { TRACKS, parseSubjects2022 } from '@/lib/careernet/subjects';

export default async function MajorSubjectsDetailPage({ params }: { params: Promise<{ seq: string }> }) {
  const { seq } = await params;
  if (!/^\d+$/.test(seq)) notFound();

  let major;
  try {
    major = await getMajor(seq);
  } catch (e) {
    return (
      <CareerShell title="학과별 국어 선택과목 가이드">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  if (!major) notFound();

  const { byTrack, source } = parseSubjects2022(major.relate_subject_2022);
  const koreanInMajor = TRACKS.flatMap((t) => byTrack[t].filter(isKoreanSubject).map((name) => ({ track: t, card: findKoreanSubject(name)! })));
  const hasAny2022 = TRACKS.some((t) => byTrack[t].length > 0);
  // 학과 자료에 국어 과목이 없으면 일반 선택 3과목(모든 학생이 대부분 이수)을 기본 안내로 보여 준다.
  const cards = koreanInMajor.length > 0 ? koreanInMajor.map((k) => k.card) : KOREAN_SUBJECTS.filter((s) => s.track === '일반 선택');

  return (
    <CareerShell title="학과별 국어 선택과목 가이드">
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-graduation-cap"></i> {major.major}
          <span style={{ marginLeft: 'auto' }}>
            <SaveToPortfolio kind="major" refId={seq} title={major.major} label="관심 학과로 저장" />
          </span>
        </div>
        <div className="eden-card-body">
          {major.summary && <p className="career-text">{cleanText(major.summary)}</p>}
          {major.department && (
            <div className="career-note">
              <strong>관련 학과명</strong> {major.department}
            </div>
          )}
        </div>
      </div>

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-book-open"></i> 권장 선택과목 (2022 개정 교육과정)
        </div>
        <div className="eden-card-body">
          {!hasAny2022 && <div className="eden-empty" style={{ padding: '20px 0' }}>이 학과는 2022 개정 교육과정 기준 선택과목 자료가 아직 제공되지 않습니다.</div>}
          {TRACKS.map((track) =>
            byTrack[track].length === 0 ? null : (
              <div key={track} style={{ marginBottom: 14 }}>
                <div className="career-section-title">{track}</div>
                <div>
                  {byTrack[track].map((name, i) =>
                    isKoreanSubject(name) ? (
                      <a key={i} href={`#subject-${encodeURIComponent(name.replace(/\s/g, ''))}`} className="career-chip korean">
                        <i className="fas fa-star" style={{ fontSize: 10, marginRight: 4 }}></i>
                        {name}
                      </a>
                    ) : (
                      <span key={i} className="career-chip">
                        {name}
                      </span>
                    )
                  )}
                </div>
              </div>
            )
          )}
          {source && <div className="career-note">원출처: {source}</div>}
          <div className="career-note" style={{ marginTop: 8 }}>
            <i className="fas fa-star" style={{ color: '#c2410c', marginRight: 4 }}></i>
            주황색은 국어 교과 과목입니다. 과목을 누르면 아래 설명 카드로 이동합니다.
          </div>
        </div>
      </div>

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-star"></i> 국어 과목 설명 카드
        </div>
        <div className="eden-card-body">
          {koreanInMajor.length === 0 && (
            <div className="career-note" style={{ marginTop: 0, marginBottom: 14 }}>
              이 학과 자료에는 국어 과목이 따로 명시되어 있지 않습니다. 대부분의 학생이 이수하는 <strong>일반 선택 국어 과목</strong>을 안내합니다.
            </div>
          )}
          {cards.map((card) => (
            <div key={card.name} id={`subject-${card.name.replace(/\s/g, '')}`} className="career-subject-card">
              <h5>
                {card.name} <span className="eden-badge eden-badge-info" style={{ marginLeft: 6 }}>{card.track}</span>
              </h5>
              <dl>
                <dt>무엇을 배우나요?</dt>
                <dd>{card.learn}</dd>
                <dt>시험과 수행평가</dt>
                <dd>{card.assess}</dd>
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={`/career/reading-guide/${seq}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-book-reader"></i> 이 학과의 탐구 독서 가이드
        </a>
        <a href={`/career/compare?a=${seq}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-columns"></i> 다른 학과와 비교
        </a>
        <a href="/career/major-subjects" className="eden-btn eden-btn-secondary">
          <i className="fas fa-search"></i> 다른 학과 검색
        </a>
      </div>
    </CareerShell>
  );
}
