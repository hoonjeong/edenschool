import { headers } from 'next/headers';
import { CAREER_MENU_FLAT, CAREERNET_CREDIT } from '@/lib/careernet/content';

/**
 * /career 하위 페이지 공통 틀: 제목 + 하위 메뉴 칩 + 커리어넷 출처 표기.
 * 출처 표기는 운영 전 확인 사항(기획서 7장)이라 모든 화면 하단에 고정으로 둔다.
 */
export async function CareerShell({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get('x-pathname') || '';

  return (
    <div className="eden-container">
      <div className="eden-breadcrumb">
        <a href="/career">이든 진로탐색 도우미</a>
        {title !== '이든 진로탐색 도우미' && <> &rsaquo; {title}</>}
      </div>
      <div className="eden-page-header">
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>

      <nav className="career-subnav" aria-label="진로 메뉴">
        {CAREER_MENU_FLAT.map((m) => (
          <a key={m.href} href={m.href} className={pathname === m.href || pathname.startsWith(m.href + '/') ? 'active' : ''}>
            {m.title}
          </a>
        ))}
      </nav>

      {children}

      <div className="career-credit">{CAREERNET_CREDIT}</div>
    </div>
  );
}

/** API 호출 실패 시 공통 안내 */
export function CareerError({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : '자료를 불러오지 못했습니다.';
  return (
    <div className="eden-empty">
      <i className="fas fa-exclamation-triangle"></i>
      {msg}
      <div style={{ fontSize: 12, marginTop: 8 }}>잠시 후 다시 시도해 주세요.</div>
    </div>
  );
}

/** 가로 막대 하나 */
export function Bar({ label, value, max = 100, accent, hint }: { label: string; value: number; max?: number; accent?: boolean; hint?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="career-bar" title={hint}>
      <div className="career-bar-label">
        <span>{label}</span>
        <strong>{Number.isInteger(value) ? value : value.toFixed(1)}</strong>
      </div>
      <div className="career-bar-track">
        <div className={`career-bar-fill${accent ? ' accent' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** 검색 폼 (GET). 학과·직업 검색 화면이 같은 모양을 쓴다. */
export function SearchForm({ action, name = 'q', value, placeholder, extra }: { action: string; name?: string; value?: string; placeholder: string; extra?: React.ReactNode }) {
  return (
    <div className="eden-card" style={{ marginBottom: 20 }}>
      <div className="eden-card-body">
        <form action={action} method="GET">
          <div className="eden-input-row">
            <input type="text" name={name} defaultValue={value} placeholder={placeholder} />
            {extra}
            <button type="submit" className="eden-btn eden-btn-primary">
              <i className="fas fa-search"></i> 검색
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
