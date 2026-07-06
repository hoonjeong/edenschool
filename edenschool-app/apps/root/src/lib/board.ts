import { toPreviewText, extractFirstImage, srcToUrl } from '@/lib/board-preview';

/** 게시판 목록 아이템 (BoardList 컴포넌트에서 사용) */
export interface BoardListItem {
  id: number;
  subject: string;
  href: string;
  preview?: string;
  thumbnail?: string | null;
  commentCount?: number;
}

/** 게시판 카테고리 (일반 게시판 /board 공용) */
export const BOARD_CATEGORIES = [
  { code: 'N', label: '공지사항' },
  { code: 'S', label: '이든이야기' },
  { code: 'C', label: '입시정보' },
  { code: 'D', label: '입시자료' },
  { code: 'R', label: '수강후기' },
] as const;

/** 게시글 행(제목/본문/댓글수)을 목록 아이템으로 변환. href만 게시판별로 다르게 넘긴다.
 *  - firstImage 필드가 있으면(MySQL 8.0 경로) 그 src를 썸네일로 사용.
 *  - 없으면(구버전 폴백 경로) 원문 HTML에서 직접 이미지 추출. */
export function toBoardItem(
  item: { id: number; subject: string; contents?: string | null; firstImage?: string | null; commentCount?: number },
  href: string,
): BoardListItem {
  const thumbnail =
    'firstImage' in item
      ? srcToUrl(item.firstImage)
      : extractFirstImage(item.contents ?? undefined);
  return {
    id: item.id,
    subject: item.subject,
    href,
    preview: toPreviewText(item.contents ?? undefined),
    thumbnail,
    commentCount: item.commentCount ?? 0,
  };
}
