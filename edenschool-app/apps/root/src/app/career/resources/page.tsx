import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { listCose, type CoseItem } from '@/lib/careernet/client';
import { COSE_TARGETS, COSE_ACTIVITY_TYPES } from '@/lib/careernet/content';

const PER_PAGE = 15;

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ t?: string; a?: string; page?: string }> }) {
  const { t = 'C', a = '', page } = await searchParams;
  const target = COSE_TARGETS.find((x) => x.code === t) ?? COSE_TARGETS[2];
  const activity = COSE_ACTIVITY_TYPES.find((x) => x.code === a);
  const pageNo = Math.max(1, parseInt(page || '1', 10) || 1);

  let items: CoseItem[] = [];
  try {
    items = await listCose({ targt: target.code, activityType: activity?.code, page: pageNo, perPage: PER_PAGE });
  } catch (e) {
    return (
      <CareerShell title="학부모 진로 자료실">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  const total = items[0] ? parseInt(items[0].totalCount || '0', 10) : 0;
  const totalPages = total ? Math.max(1, Math.ceil(total / PER_PAGE)) : items.length === PER_PAGE ? pageNo + 1 : pageNo;
  const link = (p: number, tt = target.code, aa = activity?.code ?? '') => `/career/resources?t=${tt}&a=${aa}&page=${p}`;

  return (
    <CareerShell title="학부모 진로 자료실" desc="교육부·한국직업능력연구원 등 공공기관이 발행한 진로 자료를 대상별로 모았습니다.">
      <div className="eden-tabs">
        {COSE_TARGETS.map((x) => (
          <a key={x.code} href={link(1, x.code)} className={`eden-tab${x.code === target.code ? ' active' : ''}`}>
            {x.name}
          </a>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>자료 유형:</span>
        <a href={link(1, target.code, '')} className={`eden-btn eden-btn-sm ${!activity ? 'eden-btn-primary' : 'eden-btn-secondary'}`}>
          전체
        </a>
        {COSE_ACTIVITY_TYPES.map((x) => (
          <a key={x.code} href={link(1, target.code, x.code)} className={`eden-btn eden-btn-sm ${activity?.code === x.code ? 'eden-btn-primary' : 'eden-btn-secondary'}`}>
            {x.name}
          </a>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="eden-empty">자료가 없습니다.</div>
      ) : (
        items.map((it) => {
          const files = it.attFile ? it.attFile.split(',').map((f) => f.trim()).filter(Boolean) : [];
          return (
            <div key={it.seq} className="career-result" style={{ cursor: 'default' }}>
              <div className="career-result-title">
                {it.dataTitle}
                {it.activityType && <span className="eden-badge eden-badge-info">{it.activityType}</span>}
              </div>
              <div className="career-result-sub">
                {it.author} · {it.year}년 발행 · 등록 {it.regDate}
                {it.selCount && ` · 조회 ${it.selCount}`}
              </div>
              {files.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {files.map((f, i) => (
                    <a key={i} href={f} target="_blank" rel="noopener noreferrer" className="eden-btn eden-btn-secondary eden-btn-sm">
                      <i className="fas fa-download"></i> 첨부 {files.length > 1 ? i + 1 : ''}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      <nav className="eden-pagination" style={{ marginTop: 16 }}>
        {pageNo > 1 && (
          <a className="eden-btn eden-btn-secondary eden-btn-sm" href={link(pageNo - 1)}>
            이전
          </a>
        )}
        <span style={{ fontSize: 13, padding: '0 8px' }}>{total ? `${pageNo} / ${totalPages}` : `${pageNo} 페이지`}</span>
        {pageNo < totalPages && (
          <a className="eden-btn eden-btn-secondary eden-btn-sm" href={link(pageNo + 1)}>
            다음
          </a>
        )}
      </nav>
      <div className="career-note">첨부 파일은 커리어넷 서버에서 내려받습니다.</div>
    </CareerShell>
  );
}
