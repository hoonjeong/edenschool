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

/** 게시판 카테고리 (일반 게시판 /board 공용) */
export const BOARD_CATEGORIES = [
  { code: 'N', label: '공지사항' },
  { code: 'S', label: '이든이야기' },
  { code: 'C', label: '입시정보' },
  { code: 'D', label: '입시자료' },
  { code: 'R', label: '수강후기' },
] as const;

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
