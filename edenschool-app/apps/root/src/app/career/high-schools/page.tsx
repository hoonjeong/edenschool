import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { listHighSchools, listHighMajors, type SchoolItem, type MajorListItem } from '@/lib/careernet/client';

const GUBUN_ORDER = ['일반고', '자율고', '특수목적고', '특성화고'];

export default async function HighSchoolsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'schools' } = await searchParams;

  let schools: SchoolItem[] = [];
  let majors: MajorListItem[] = [];
  try {
    [schools, majors] = await Promise.all([listHighSchools('100276'), listHighMajors()]);
  } catch (e) {
    return (
      <CareerShell title="중3 고등학교 탐색">
        <CareerError error={e} />
      </CareerShell>
    );
  }

  // 경기도 전체에서 부천시 소재만 고른다 (API 에 시·군 필터가 없다)
  const bucheon = schools.filter((s) => s.adres.includes('부천'));
  const gubuns = Array.from(new Set(bucheon.map((s) => s.schoolGubun))).sort((a, b) => {
    const ia = GUBUN_ORDER.indexOf(a);
    const ib = GUBUN_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const majorsByClass = new Map<string, MajorListItem[]>();
  for (const m of majors) {
    const list = majorsByClass.get(m.lClass) ?? [];
    list.push(m);
    majorsByClass.set(m.lClass, list);
  }

  return (
    <CareerShell title="중3 고등학교 탐색" desc="고입을 앞둔 중3 학생을 위한 부천 지역 고등학교 정보와 특성화고 학과 안내입니다.">
      <div className="eden-tabs">
        <a href="/career/high-schools?tab=schools" className={`eden-tab${tab === 'schools' ? ' active' : ''}`}>
          부천 고등학교 ({bucheon.length})
        </a>
        <a href="/career/high-schools?tab=majors" className={`eden-tab${tab === 'majors' ? ' active' : ''}`}>
          특성화고 학과 ({majors.length})
        </a>
      </div>

      {tab === 'schools' && (
        <>
          {gubuns.map((g) => {
            const rows = bucheon
              .filter((s) => s.schoolGubun === g)
              .sort((a, b) => a.schoolName.localeCompare(b.schoolName, 'ko'));
            return (
              <div key={g} className="eden-card" style={{ marginBottom: 16 }}>
                <div className="eden-card-header">
                  <i className="fas fa-school"></i> {g}
                  <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>{rows.length}개교</span>
                </div>
                <div className="eden-card-body" style={{ padding: 0 }}>
                  <table className="eden-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>학교</th>
                        <th>설립</th>
                        <th>주소</th>
                        <th>홈페이지</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((s) => (
                        <tr key={s.seq}>
                          <td>
                            <strong>{s.schoolName}</strong>
                          </td>
                          <td>{s.estType}</td>
                          <td style={{ fontSize: 13, color: '#64748b' }}>{s.adres}</td>
                          <td>
                            {s.link && (
                              <a href={s.link.startsWith('http') ? s.link : `http://${s.link}`} target="_blank" rel="noopener noreferrer" aria-label={`${s.schoolName} 홈페이지`}>
                                <i className="fas fa-external-link-alt"></i>
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === 'majors' && (
        <>
          <div className="career-note" style={{ marginTop: 0, marginBottom: 16 }}>
            특성화고 학과를 계열별로 보여 줍니다. 학과를 누르면 교육 내용·진출 분야·개설 학교를 볼 수 있습니다.
          </div>
          {Array.from(majorsByClass.entries()).map(([cls, list]) => (
            <div key={cls} style={{ marginBottom: 16 }}>
              <div className="career-section-title">{cls}</div>
              <div>
                {list.map((m) => (
                  <a key={m.majorSeq} href={`/career/high-schools/major/${m.majorSeq}`} className="career-chip" style={{ textDecoration: 'none' }}>
                    {m.mClass}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

    </CareerShell>
  );
}
