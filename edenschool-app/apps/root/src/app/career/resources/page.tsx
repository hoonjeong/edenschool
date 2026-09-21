import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { listCose, getAttachmentName, type CoseItem } from '@/lib/careernet/client';
import { COSE_TARGETS, COSE_ACTIVITY_TYPES } from '@/lib/careernet/content';

const PER_PAGE = 15;

/** 첨부 URL 목록 → 파일명 (HEAD 로 조회, 실패 시 "첨부 n") */
async function withNames(item: CoseItem): Promise<{ url: string; name: string }[]> {
  const urls = item.attFile ? item.attFile.split(',').map((f) => f.trim()).filter(Boolean) : [];
  const names = await Promise.all(urls.map((u) => getAttachmentName(u)));
  return urls.map((url, i) => ({ url, name: names[i] || (urls.length > 1 ? `첨부 ${i + 1}` : '첨부 파일') }));
}

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'fa-file-pdf';
  if (['hwp', 'hwpx', 'doc', 'docx'].includes(ext)) return 'fa-file-word';
  if (['ppt', 'pptx'].includes(ext)) return 'fa-file-powerpoint';
  if (['xls', 'xlsx'].includes(ext)) return 'fa-file-excel';
  if (['zip', '7z'].includes(ext)) return 'fa-file-archive';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'fa-file-image';
  if (['mp4', 'avi', 'mov'].includes(ext)) return 'fa-file-video';
  return 'fa-file-download';
}

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ t?: string; a?: string; page?: string }> }) {
  const { t = 'C', a = '', page } = await searchParams;
  const target = COSE_TARGETS.find((x) => x.code === t) ?? COSE_TARGETS[0];
  const activity = COSE_ACTIVITY_TYPES.find((x) => x.code === a);
  const pageNo = Math.max(1, parseInt(page || '1', 10) || 1);

  let items: (CoseItem & { files: { url: string; name: string }[] })[] = [];
  try {
    const rows = await listCose({ targt: target.code, activityType: activity?.code, page: pageNo, perPage: PER_PAGE });
    const files = await Promise.all(rows.map(withNames));
    items = rows.map((r, i) => ({ ...r, files: files[i] }));
  } catch (e) {
    return (
      <CareerShell title="학부모 진로 자료실">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  // 목록 응답에 전체 건수가 없어, 한 페이지가 꽉 찼으면 다음 페이지가 있다고 본다
  const hasNext = items.length === PER_PAGE;
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
        <div className="eden-empty">
          <i className="fas fa-folder-open"></i>
          {pageNo > 1 ? '더 이상 자료가 없습니다.' : '조건에 맞는 자료가 없습니다.'}
        </div>
      ) : (
        items.map((it) => (
          <div key={it.seq} className="career-result" style={{ cursor: 'default' }}>
            <div className="career-result-title">
              {it.dataTitle}
              {it.activityType && <span className="eden-badge eden-badge-info">{it.activityType}</span>}
            </div>
            <div className="career-result-sub">
              {it.author} · {it.year}년 발행 · 등록 {it.regDate}
              {it.selCount && ` · 조회 ${it.selCount}`}
            </div>
            {it.files.length > 0 && (
              <ul className="career-file-list">
                {it.files.map((f, i) => (
                  <li key={i}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      <i className={`far ${fileIcon(f.name)}`}></i> {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}

      {(pageNo > 1 || hasNext) && (
        <nav className="eden-pagination" style={{ marginTop: 16 }}>
          {pageNo > 1 && (
            <a className="eden-btn eden-btn-secondary eden-btn-sm" href={link(pageNo - 1)}>
              이전
            </a>
          )}
          <span style={{ fontSize: 13, padding: '0 8px' }}>{pageNo} 페이지</span>
          {hasNext && (
            <a className="eden-btn eden-btn-secondary eden-btn-sm" href={link(pageNo + 1)}>
              다음
            </a>
          )}
        </nav>
      )}
      <div className="career-note">첨부 파일은 커리어넷 서버에서 내려받습니다.</div>
    </CareerShell>
  );
}
