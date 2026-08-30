import { toPreviewText, srcToUrl } from '@/lib/board-preview';

/** 게시판 목록 아이템 (BoardList 컴포넌트에서 사용) */
export interface BoardListItem {
  id: number;
  subject: string;
  href: string;
  preview?: string;
  thumbnail?: string | null;
  commentCount?: number;
}

/**
 * 게시판 카테고리 (일반 게시판 /board 공용).
 * - code: DB(post_info.category) 저장값. 변경 금지.
 * - slug: URL 세그먼트(/board/{slug}). 검색엔진에 노출되는 값이라 변경 시 301 필요.
 */
export const BOARD_CATEGORIES = [
  { code: 'N', slug: 'notice', label: '공지사항', description: '이든배움국어학원 공지사항 - 개강·시간표·휴원 등 학원 소식을 안내합니다.' },
  { code: 'S', slug: 'story', label: '이든이야기', description: '이든배움국어학원 이야기 - 수업 현장과 학원 소식을 전합니다.' },
  { code: 'C', slug: 'admission', label: '입시정보', description: '부천 지역 고교 내신·수능 국어 입시정보 - 학교별 시험 유형과 대입 일정을 정리합니다.' },
  { code: 'D', slug: 'materials', label: '입시자료', description: '내신·수능 국어 입시자료 - 학교별 기출과 학습 자료를 제공합니다.' },
  { code: 'R', slug: 'review', label: '수강후기', description: '이든배움국어학원 수강후기 - 재원생과 학부모가 남긴 실제 후기입니다.' },
] as const;

export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

/** 기본 카테고리(공지사항). /board 진입 시 이 카테고리로 보낸다. */
export const DEFAULT_CATEGORY = BOARD_CATEGORIES[0];

/** 목록 한 페이지당 게시글 수 */
export const BOARD_PAGE_SIZE = 20;

export function categoryBySlug(slug: string): BoardCategory | undefined {
  return BOARD_CATEGORIES.find((c) => c.slug === slug);
}

export function categoryByCode(code?: string | null): BoardCategory | undefined {
  return BOARD_CATEGORIES.find((c) => c.code === code);
}

/**
 * 제목 → URL 슬러그.
 * 한글은 그대로 살린다(구글/네이버 모두 퍼센트 인코딩된 한글을 디코딩해 노출하며,
 * 국어학원 특성상 검색 키워드가 한글이라 로마자 변환보다 유리).
 */
export function toTitleSlug(subject: string): string {
  const slug = (subject || '')
    .normalize('NFC')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
    .toLowerCase();
  return slug || 'post';
}

/**
 * 게시글 상세 경로: /board/{categorySlug}/{id}-{titleSlug}
 * 퍼센트 인코딩하지 않은 원본 경로를 돌려준다 — href 와 redirect 에 그대로 쓴다.
 * (인코딩된 경로를 redirect 에 넘기면 이중 인코딩되어 리디렉트 루프가 난다.)
 * 절대 URL(canonical/OG/sitemap)이 필요하면 encodePathname() 을 씌운다.
 */
export function boardPostPath(post: { id: number; subject: string; category?: string | null }): string {
  const cat = categoryByCode(post.category) ?? DEFAULT_CATEGORY;
  return `/board/${cat.slug}/${post.id}-${toTitleSlug(post.subject)}`;
}

/** 경로를 세그먼트 단위로 퍼센트 인코딩 (절대 URL·사이트맵용). '/' 는 보존한다. */
export function encodePathname(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

/**
 * 경로 비교용 정규화.
 * 요청 경로가 디코딩되어 올 수도, 퍼센트 인코딩된 채로 올 수도, 이중 인코딩될 수도 있어
 * 더 이상 안 풀릴 때까지 디코딩한 뒤 유니코드 정규화(NFC)까지 맞춘다.
 */
function normalizeForCompare(path: string): string {
  let s = path;
  for (let i = 0; i < 3; i++) {
    if (!/%[0-9a-fA-F]{2}/.test(s)) break;
    try {
      const decoded = decodeURIComponent(s);
      if (decoded === s) break;
      s = decoded;
    } catch {
      break;
    }
  }
  return s.normalize('NFC').toLowerCase();
}

/** 요청 경로와 정식 경로가 같은 곳을 가리키는가 (인코딩·정규화 차이 무시) */
export function isSamePath(a: string, b: string): boolean {
  return normalizeForCompare(a) === normalizeForCompare(b);
}

/** 게시판 목록 경로: /board/{categorySlug} (2페이지 이상만 ?page= 부착) */
export function boardListPath(slug: string, page = 1): string {
  return page > 1 ? `/board/${slug}?page=${page}` : `/board/${slug}`;
}

/** 게시글 행(제목/본문/댓글수)을 목록 아이템으로 변환. href만 게시판별로 다르게 넘긴다.
 *  contents=본문 앞부분(발췌용), firstImage=쿼리에서 뽑은 첫 이미지 경로(썸네일용). */
export function toBoardItem(
  item: { id: number; subject: string; contents?: string | null; firstImage?: string | null; commentCount?: number },
  href: string,
): BoardListItem {
  return {
    id: item.id,
    subject: item.subject,
    href,
    preview: toPreviewText(item.contents),
    thumbnail: srcToUrl(item.firstImage),
    commentCount: item.commentCount ?? 0,
  };
}
