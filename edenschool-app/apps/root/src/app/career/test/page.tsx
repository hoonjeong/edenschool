import { CareerShell } from '@/components/career/CareerShell';
import { TEST_CATALOG } from '@/lib/careernet/content';

export default function TestCenterPage() {
  // 같은 검사의 중·고 버전을 한 카드로 묶는다
  const groups = Array.from(new Map(TEST_CATALOG.map((t) => [t.name, TEST_CATALOG.filter((x) => x.name === t.name)])).values());

  return (
    <CareerShell title="진로심리검사 센터" desc="커리어넷 공인 진로심리검사를 홈페이지에서 바로 응시하고, 결과를 국어 역량 리포트로 이어 보세요.">
      <div className="career-note" style={{ marginTop: 0, marginBottom: 16 }}>
        결과 계산에 필요한 <strong>학년·성별</strong>만 입력하며 이름·학교·이메일은 수집하지 않습니다. 결과는 커리어넷 결과 페이지 링크로 제공됩니다.
        커리어넷 정책에 따라 이용량이 제한될 수 있어 학원생 대상으로 우선 운영합니다.
      </div>

      <div className="career-grid">
        {groups.map((g) => (
          <div key={g[0].name} className="eden-card">
            <div className="eden-card-header">
              <i className="fas fa-clipboard-check"></i> {g[0].name}
            </div>
            <div className="eden-card-body">
              <p style={{ fontSize: 13, color: '#475569', minHeight: 40 }}>{g[0].desc}</p>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>약 {g[0].minutes}분</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {g.map((t) => (
                  <a key={t.qno} href={`/career/test/${t.qno}`} className="eden-btn eden-btn-primary eden-btn-sm">
                    {t.target}용
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="career-eden-box career-mt">
        <strong>검사 후에는</strong> — 결과에서 확인한 관심 직업을 <a href="/career/job-report">직업별 국어 역량 리포트</a>에서 검색하면, 그 직업에서 국어 지식과 언어 능력이 얼마나 중요한지 바로 볼 수 있습니다.
      </div>
    </CareerShell>
  );
}
