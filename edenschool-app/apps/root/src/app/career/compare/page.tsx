import { CareerShell, CareerError, Bar } from '@/components/career/CareerShell';
import { MajorSearch } from '@/components/career/MajorSearch';
import { getMajor, type MajorDetail, type ChartItem } from '@/lib/careernet/client';
import { TRACKS, parseSubjects2022 } from '@/lib/careernet/subjects';
import { isKoreanSubject } from '@/lib/careernet/content';

type Search = { a?: string; b?: string; q?: string; subject?: string; region?: string };

const REGION_FILTERS = [
  { key: '', name: '전체 지역' },
  { key: '서울특별시', name: '서울' },
  { key: '경기도', name: '경기' },
  { key: '인천광역시', name: '인천' },
];

function pct(items: ChartItem[] | undefined, item: string): number | null {
  const v = items?.find((x) => x.item === item)?.data;
  return v === undefined ? null : Number(v);
}

function MajorColumn({ seq, major, region, other }: { seq: string; major: MajorDetail; region: string; other?: string }) {
  const chart = major.chartData?.[0];
  const { byTrack } = parseSubjects2022(major.relate_subject_2022);
  const korean = TRACKS.flatMap((t) => byTrack[t].filter(isKoreanSubject));
  const univs = (major.university ?? []).filter((u) => !region || u.area === region);
  const fieldTop = [...(chart?.field ?? [])].sort((a, b) => Number(b.data) - Number(a.data)).slice(0, 3);
  const employment = pct(chart?.employment_rate, '전체');
  const applicant = pct(chart?.applicant, '지원자');
  const entrant = pct(chart?.applicant, '입학자');
  const satisfied = (pct(chart?.satisfaction, '만족') ?? 0) + (pct(chart?.satisfaction, '매우 만족') ?? 0);

  return (
    <div className="eden-card">
      <div className="eden-card-header">
        <i className="fas fa-graduation-cap"></i> {major.major}
        <a href={`/career/compare?${other ? `a=${other}` : ''}`} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400 }} title="이 학과 바꾸기">
          <i className="fas fa-exchange-alt"></i> 바꾸기
        </a>
      </div>
      <div className="eden-card-body">
        <table className="career-stat-table">
          <tbody>
            <tr>
              <th>입학 상황</th>
              <td>{applicant !== null ? `지원 ${applicant.toLocaleString()}명 / 입학 ${entrant?.toLocaleString()}명` : '-'}</td>
            </tr>
            <tr>
              <th>취업률</th>
              <td>{employment !== null ? `${employment}%` : '-'}</td>
            </tr>
            <tr>
              <th>첫 직장 만족도</th>
              <td>{chart?.satisfaction ? `만족 이상 ${Math.round(satisfied)}%` : '-'}</td>
            </tr>
            <tr>
              <th>첫 직장 월평균 임금</th>
              <td>{major.salary ? `약 ${major.salary}만원` : '-'}</td>
            </tr>
            <tr>
              <th>졸업 후 첫 직업 분야</th>
              <td>{fieldTop.length ? fieldTop.map((f) => `${f.item} ${f.data}%`).join(', ') : '-'}</td>
            </tr>
            <tr>
              <th>국어 권장 과목</th>
              <td>{korean.length ? korean.join(', ') : '명시 없음'}</td>
            </tr>
          </tbody>
        </table>

        {chart?.avg_salary && (
          <>
            <div className="career-section-title career-mt">첫 직장 월평균 임금 분포</div>
            {chart.avg_salary.map((s) => (
              <Bar key={s.item} label={s.item} value={Number(s.data)} />
            ))}
          </>
        )}

        <div className="career-section-title career-mt">
          개설 대학 <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>({univs.length}개)</span>
        </div>
        {univs.length === 0 ? (
          <div className="career-note" style={{ marginTop: 0 }}>해당 지역 개설 대학이 없습니다.</div>
        ) : (
          <ul className="career-list" style={{ fontSize: 13, maxHeight: 260, overflowY: 'auto' }}>
            {univs.map((u, i) => (
              <li key={i}>
                <a href={u.schoolURL} target="_blank" rel="noopener noreferrer">
                  {u.schoolName}
                </a>{' '}
                {u.majorName} <span style={{ color: '#94a3b8' }}>· {u.area}</span>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 10 }}>
          <a href={`/career/major-subjects/${seq}`} className="eden-btn eden-btn-secondary eden-btn-sm">
            국어 선택과목 가이드
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<Search> }) {
  const { a, b, q, subject, region = '' } = await searchParams;
  const seqA = a && /^\d+$/.test(a) ? a : undefined;
  const seqB = b && /^\d+$/.test(b) ? b : undefined;

  let majorA: MajorDetail | null = null;
  let majorB: MajorDetail | null = null;
  let error: unknown = null;
  try {
    [majorA, majorB] = await Promise.all([seqA ? getMajor(seqA) : null, seqB ? getMajor(seqB) : null]);
  } catch (e) {
    error = e;
  }

  const bothSelected = !!(majorA && majorB);

  return (
    <CareerShell title="대학 학과 비교 카드" desc="관심 학과 두 개를 나란히 놓고 입학 상황·취업률·임금·만족도·개설 대학을 비교합니다.">
      {error !== null && <CareerError error={error} />}

      {!bothSelected && (
        <>
          <div className="career-note" style={{ marginTop: 0, marginBottom: 16 }}>
            {majorA ? (
              <>
                첫 번째 학과: <strong>{majorA.major}</strong> — 비교할 두 번째 학과를 검색해 고르세요.
              </>
            ) : (
              '비교할 첫 번째 학과를 검색해 고르세요.'
            )}
          </div>
          <MajorSearch
            action="/career/compare"
            basePath="/career/compare/pick"
            q={q}
            subject={subject}
            extraQuery={seqA ? `a=${seqA}` : undefined}
            hidden={seqA ? { a: seqA } : undefined}
          />
        </>
      )}

      {bothSelected && majorA && majorB && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>개설 대학 지역:</span>
            {REGION_FILTERS.map((r) => (
              <a key={r.key} href={`/career/compare?a=${seqA}&b=${seqB}&region=${encodeURIComponent(r.key)}`} className={`eden-btn eden-btn-sm ${region === r.key ? 'eden-btn-primary' : 'eden-btn-secondary'}`}>
                {r.name}
              </a>
            ))}
            <a href="/career/compare" className="eden-btn eden-btn-sm eden-btn-outline" style={{ marginLeft: 'auto' }}>
              처음부터 다시
            </a>
          </div>
          <div className="career-grid-2">
            <MajorColumn seq={seqA!} major={majorA} region={region} other={seqB} />
            <MajorColumn seq={seqB!} major={majorB} region={region} other={seqA} />
          </div>
          <div className="career-note">입학 상황·취업률·임금·만족도는 커리어넷이 제공하는 조사 자료(대졸자 직업이동경로조사 등)를 그대로 표시한 것입니다.</div>
        </>
      )}
    </CareerShell>
  );
}
