import { headers } from 'next/headers';
import { CAREER_MENU, CAREERNET_CREDIT } from '@/lib/careernet/content';

const HOME_TITLE = '이든 진로탐색 도우미';

/**
 * /career 하위 페이지 공통 틀: 왼쪽 그룹형 메뉴 + 오른쪽 본문 + 커리어넷 출처 표기.
 * 허브(/career)는 카드로 메뉴를 보여 주므로 사이드 메뉴를 붙이지 않는다.
 * 좁은 화면에서는 사이드 메뉴가 접이식(details)으로 바뀐다.
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
  const isHome = title === HOME_TITLE;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const sideMenu = (
    <nav className="career-side" aria-label="진로탐색 메뉴">
      <a href="/career" className={`career-side-home${pathname === '/career' ? ' active' : ''}`}>
        <i className="fas fa-compass"></i> {HOME_TITLE}
      </a>
      {CAREER_MENU.map((group) => (
        <div key={group.key} className="career-side-group">
          <div className="career-side-title">{group.title}</div>
          {group.items.map((m) => (
            <a key={m.href} href={m.href} className={isActive(m.href) ? 'active' : ''}>
              <i className={`fas ${m.icon}`}></i>
              <span>{m.title}</span>
            </a>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="eden-container">
      <div className="eden-breadcrumb">
        <a href="/career">{HOME_TITLE}</a>
        {!isHome && <> &rsaquo; {title}</>}
      </div>
      <div className="eden-page-header">
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>

      {isHome ? (
        children
      ) : (
        <div className="career-layout">
          <aside className="career-aside">
            {/* 넓은 화면: 항상 펼침 / 좁은 화면: 접이식 */}
            <details className="career-side-mobile">
              <summary>
                <i className="fas fa-bars"></i> 진로탐색 메뉴
              </summary>
              {sideMenu}
            </details>
            <div className="career-side-desktop">{sideMenu}</div>
          </aside>
          <div className="career-main">{children}</div>
        </div>
      )}

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
