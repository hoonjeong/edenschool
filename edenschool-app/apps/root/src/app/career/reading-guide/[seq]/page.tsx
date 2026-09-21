import { notFound } from 'next/navigation';
import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { SaveToPortfolio } from '@/components/career/SaveToPortfolio';
import { getMajor, cleanText } from '@/lib/careernet/client';
import { READING_BY_CLASS } from '@/lib/careernet/content';

export default async function ReadingGuideDetailPage({ params, searchParams }: { params: Promise<{ seq: string }>; searchParams: Promise<{ cls?: string }> }) {
  const { seq } = await params;
  const { cls } = await searchParams;
  if (!/^\d+$/.test(seq)) notFound();

  let major;
  try {
    major = await getMajor(seq);
  } catch (e) {
    return (
      <CareerShell title="진로 연계 주제 탐구 독서 가이드">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  if (!major) notFound();

  const acts = (major.career_act ?? []).map((a) => ({ name: cleanText(a.act_name), desc: cleanText(a.act_description) })).filter((a) => a.name);
  const books = (cls && READING_BY_CLASS[cls]) || [];

  // 학과 개요와 주요 교과목에서 탐구 질문의 출발점을 만든다 (선생님 콘텐츠가 채워지기 전까지의 기본 안내).
  const starterQuestions = [
    `${major.major}에서 배우는 내용이 우리 사회의 어떤 문제와 연결되는가?`,
    ...(major.main_subject ?? []).slice(0, 2).map((s) => `'${s.SBJECT_NM}'은(는) 왜 이 전공의 핵심 과목일까? 관련 책 한 권을 찾아 읽어 보자.`),
    `${major.major} 졸업 후 진출 분야에서 최근 10년간 달라진 점은 무엇인가?`,
  ];

  return (
    <CareerShell title="진로 연계 주제 탐구 독서 가이드">
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-graduation-cap"></i> {major.major}
          {cls && <span className="eden-badge eden-badge-info">{cls}</span>}
          <span style={{ marginLeft: 'auto' }}>
            <SaveToPortfolio kind="major" refId={seq} title={major.major} label="관심 학과로 저장" />
          </span>
        </div>
        <div className="eden-card-body">
          {major.summary && <p className="career-text">{cleanText(major.summary)}</p>}
          {major.interest && (
            <div className="career-note">
              <strong>이런 학생에게 맞아요</strong>
              <div style={{ marginTop: 4 }}>{cleanText(major.interest)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="career-grid-2">
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-university"></i> 대학에서 배우는 주요 교과목
          </div>
          <div className="eden-card-body">
            {(major.main_subject ?? []).length === 0 && <div className="career-note" style={{ marginTop: 0 }}>제공된 교과목 정보가 없습니다.</div>}
            {(major.main_subject ?? []).map((s) => (
              <div key={s.SBJECT_NM} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.SBJECT_NM}</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{cleanText(s.SBJECT_SUMRY)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-compass"></i> 진로 탐색 활동
          </div>
          <div className="eden-card-body">
            {acts.length === 0 && <div className="career-note" style={{ marginTop: 0 }}>제공된 활동 정보가 없습니다.</div>}
            {acts.map((a) => (
              <div key={a.name} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                {a.desc && <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{a.desc}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="eden-card career-mt">
        <div className="eden-card-header">
          <i className="fas fa-book-reader"></i> 추천 도서와 탐구 질문
        </div>
        <div className="eden-card-body">
          {books.length > 0 ? (
            books.map((b) => (
              <div key={b.title} className="career-subject-card">
                <h5>
                  {b.title} <span style={{ fontSize: 12, fontWeight: 400, color: '#78716c' }}>{b.author}</span>
                </h5>
                <ul className="career-list">
                  {b.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <>
              <div className="career-note" style={{ marginTop: 0 }}>
                {cls ? `${cls} 추천 도서 목록은 준비 중입니다.` : '계열별 추천 도서 목록은 준비 중입니다.'} 그동안 아래 탐구 질문으로 시작해 보세요.
              </div>
              <div className="career-section-title career-mt">탐구 질문 (출발점)</div>
              <ul className="career-list">
                {starterQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="career-mt" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={`/career/major-subjects/${seq}?cls=${encodeURIComponent(cls ?? '')}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-book-open"></i> 이 학과의 국어 선택과목
        </a>
        <a href="/career/reading-guide" className="eden-btn eden-btn-secondary">
          <i className="fas fa-search"></i> 다른 학과 검색
        </a>
      </div>
    </CareerShell>
  );
}
