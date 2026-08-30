import { permanentRedirect } from 'next/navigation';
import { boardListPath, categoryByCode, DEFAULT_CATEGORY } from '@/lib/board';

/**
 * 구 게시판 목록 URL(/board, /board?category=CODE) → 카테고리별 정식 URL(/board/{slug}) 로 영구 이동.
 * 같은 목록이 /board 와 /board?category=N 두 주소로 색인되던 중복을 제거한다.
 */
export default async function BoardIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const cat = categoryByCode(category) ?? DEFAULT_CATEGORY;
  permanentRedirect(boardListPath(cat.slug));
}
