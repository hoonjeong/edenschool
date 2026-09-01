import { permanentRedirect } from 'next/navigation';
import { ALL_CATEGORY, boardListPath, categoryByCode } from '@/lib/board';

/**
 * 구 게시판 목록 URL(/board, /board?category=CODE) → 정식 URL(/board/{slug}) 로 영구 이동.
 * 같은 목록이 /board 와 /board?category=N 두 주소로 색인되던 중복을 제거한다.
 * 카테고리 지정이 없으면 게시판 진입점인 전체보기(/board/all)로 보낸다.
 */
export default async function BoardIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const cat = categoryByCode(category);
  permanentRedirect(boardListPath(cat ? cat.slug : ALL_CATEGORY.slug));
}
