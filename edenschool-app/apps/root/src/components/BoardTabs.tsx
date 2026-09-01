import { ALL_CATEGORY, BOARD_CATEGORIES, boardListPath } from '@/lib/board';

/**
 * 게시판 카테고리 탭 (일반 게시판 + 질문게시판 공용).
 * active: 활성 탭 표시용 — 카테고리 슬러그('all'|'notice'|'story'|...) 또는 질문게시판이면 'qna'.
 * 맨 앞의 '전체보기'는 카테고리 구분 없이 최신순 전체 목록을 보여준다.
 */
export function BoardTabs({ active }: { active: string }) {
  return (
    <div className="eden-tabs">
      <a
        href={boardListPath(ALL_CATEGORY.slug)}
        className={`eden-tab${active === ALL_CATEGORY.slug ? ' active' : ''}`}
      >
        {ALL_CATEGORY.label}
      </a>
      {BOARD_CATEGORIES.map((cat) => (
        <a
          key={cat.code}
          href={boardListPath(cat.slug)}
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
