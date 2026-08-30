import { BOARD_CATEGORIES } from '@/lib/board';

/**
 * 게시판 카테고리 탭 (일반 게시판 + 질문게시판 공용).
 * active: 활성 탭 표시용 — 카테고리 슬러그('notice'|'story'|...) 또는 질문게시판이면 'qna'.
 */
export function BoardTabs({ active }: { active: string }) {
  return (
    <div className="eden-tabs">
      {BOARD_CATEGORIES.map((cat) => (
        <a
          key={cat.code}
          href={`/board/${cat.slug}`}
          className={`eden-tab${active === cat.slug ? ' active' : ''}`}
        >
          {cat.label}
        </a>
      ))}
      <a href="/qna" className={`eden-tab${active === 'qna' ? ' active' : ''}`}>
        질문게시판
      </a>
    </div>
  );
}
