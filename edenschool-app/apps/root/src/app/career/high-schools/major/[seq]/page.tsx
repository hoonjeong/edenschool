import { notFound } from 'next/navigation';
import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { getHighMajor, cleanText } from '@/lib/careernet/client';

export default async function HighMajorPage({ params }: { params: Promise<{ seq: string }> }) {
  const { seq } = await params;
  if (!/^\d+$/.test(seq)) notFound();

  let major;
  try {
    major = await getHighMajor(seq);
  } catch (e) {
    return (
      <CareerShell title="중3 고등학교 탐색">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  if (!major) notFound();

  const schools = major.setshl ?? [];
  const nearby = schools.filter((s) => ['경기도', '서울특별시', '인천광역시'].includes(s.area));

  return (
    <CareerShell title="중3 고등학교 탐색">
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-school"></i> 특성화고 {major.major}
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

      <div className="career-grid-2">
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-book"></i> 교육 내용
          </div>
          <div className="eden-card-body">
            <div className="career-text">{cleanText(major.purpose)}</div>
            {major.interest && (
              <>
                <div className="career-section-title career-mt">이런 학생에게 맞아요</div>
                <div className="career-text">{cleanText(major.interest)}</div>
              </>
            )}
          </div>
        </div>
        <div className="eden-card">
          <div className="eden-card-header">
            <i className="fas fa-briefcase"></i> 진출 분야
          </div>
          <div className="eden-card-body">
            <div className="career-text">{cleanText(major.relatedjob)}</div>
          </div>
        </div>
      </div>

      <div className="eden-card career-mt">
        <div className="eden-card-header">
          <i className="fas fa-map-marker-alt"></i> 개설 학교 (수도권 {nearby.length}개 / 전국 {schools.length}개)
        </div>
        <div className="eden-card-body">
          {nearby.length === 0 ? (
            <div className="career-note" style={{ marginTop: 0 }}>수도권 개설 학교가 없습니다.</div>
          ) : (
            <ul className="career-list" style={{ fontSize: 13 }}>
              {nearby.map((s, i) => (
                <li key={i}>
                  <a href={s.schoolURL} target="_blank" rel="noopener noreferrer">
                    {s.schoolName}
                  </a>{' '}
                  {s.majorName} <span style={{ color: '#94a3b8' }}>· {s.area}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="career-mt">
        <a href="/career/high-schools?tab=majors" className="eden-btn eden-btn-secondary">
          <i className="fas fa-list"></i> 특성화고 학과 목록
        </a>
      </div>
    </CareerShell>
  );
}
