import { CareerShell, Bar } from '@/components/career/CareerShell';
import { KOREAN_SUBJECTS } from '@/lib/careernet/content';
import data from '@/data/careernet-subject-map.json';

interface ClassStat {
  code: string;
  name: string;
  majorCount: number;
  withData: number;
  counts: Record<string, number>;
  majors: Record<string, string[]>;
}

const stats = data as { generatedAt: string; classes: ClassStat[] };

export default async function SubjectMapPage({ searchParams }: { searchParams: Promise<{ cls?: string }> }) {
  const { cls } = await searchParams;
  const selected = stats.classes.find((c) => c.code === cls);
  const generated = stats.generatedAt ? new Date(stats.generatedAt).toLocaleDateString('ko-KR') : '';

  return (
    <CareerShell title="계열별 국어 과목 지도" desc="계열마다 어떤 국어 선택과목이 많이 권장되는지 통계로 보여 줍니다.">
      <div className="career-note" style={{ marginTop: 0, marginBottom: 16 }}>
        커리어넷 학과정보의 2022 개정 교육과정 권장 선택과목을 계열별로 모아 계산했습니다. 비율은 <strong>선택과목 자료가 있는 학과</strong> 중 해당 과목을 권장하는 학과의 비율입니다.
        {generated && ` (집계일 ${generated})`}
      </div>

      <div className="career-grid">
        {stats.classes.map((c) => {
          const top = KOREAN_SUBJECTS.map((s) => ({ name: s.name, count: c.counts[s.name] ?? 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
          return (
            <div key={c.code} className="eden-card" style={c.code === cls ? { borderColor: 'var(--eden-primary)' } : undefined}>
              <div className="eden-card-header">
                <i className="fas fa-layer-group"></i> {c.name}
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>학과 {c.withData}개</span>
              </div>
              <div className="eden-card-body">
                {c.withData === 0 ? (
                  <div className="career-note" style={{ marginTop: 0 }}>자료 없음</div>
                ) : (
                  top.map((t) => <Bar key={t.name} label={t.name} value={Math.round((t.count / c.withData) * 100)} accent />)
                )}
                <a href={`/career/subject-map?cls=${c.code}#detail`} className="eden-btn eden-btn-secondary eden-btn-sm" style={{ marginTop: 8 }}>
                  전체 과목 보기
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div id="detail" className="eden-card career-mt">
          <div className="eden-card-header">
            <i className="fas fa-chart-bar"></i> {selected.name} — 국어 과목별 권장 비율
          </div>
          <div className="eden-card-body">
            {(['일반 선택', '진로 선택', '융합 선택'] as const).map((track) => (
              <div key={track} style={{ marginBottom: 16 }}>
                <div className="career-section-title">{track}</div>
                {KOREAN_SUBJECTS.filter((s) => s.track === track).map((s) => {
                  const count = selected.counts[s.name] ?? 0;
                  const pct = selected.withData ? Math.round((count / selected.withData) * 100) : 0;
                  const list = selected.majors[s.name] ?? [];
                  return (
                    <details key={s.name} style={{ marginBottom: 6 }}>
                      <summary style={{ cursor: 'pointer', listStyle: 'none' }}>
                        <Bar label={`${s.name} (${count}개 학과)`} value={pct} accent={pct >= 50} />
                      </summary>
                      <div style={{ fontSize: 13, color: '#475569', padding: '4px 0 8px', lineHeight: 1.7 }}>
                        {list.length > 0 ? list.join(', ') : '권장하는 학과가 없습니다.'}
                      </div>
                    </details>
                  );
                })}
              </div>
            ))}
            <div className="career-note">막대를 누르면 해당 과목을 권장하는 학과 목록이 펼쳐집니다.</div>
          </div>
        </div>
      )}

      <div className="career-eden-box career-mt">
        <strong>활용</strong> — 학부모 설명회에서 "이 계열 학과의 ○○%가 '독서와 작문'을 권장합니다"처럼 근거 있는 과목 선택 안내에 쓸 수 있습니다.
        개별 학과의 정확한 과목은 <a href="/career/major-subjects">학과별 국어 선택과목 가이드</a>에서 확인하세요.
      </div>
    </CareerShell>
  );
}
