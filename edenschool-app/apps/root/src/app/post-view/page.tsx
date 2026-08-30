import { notFound, permanentRedirect } from 'next/navigation';
import { selectPostInfoById } from '@edenschool/common/queries/post';
import { boardPostPath } from '@/lib/board';

/**
 * 레거시 게시글 URL(/post-view?id=123, /post-view.html?id=123 → 이 경로로 301)을
 * 정식 slug URL(/board/{category}/{id}-{slug})로 영구 이동시킨다.
 * 이미 색인된 옛 주소의 링크 자산을 새 주소로 승계하기 위해 유지한다.
 */
export default async function PostViewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const postId = Number(id);
  if (!postId || !Number.isInteger(postId) || postId <= 0) permanentRedirect('/board/notice');

  const post = await selectPostInfoById(postId);
  if (!post) notFound();

  permanentRedirect(boardPostPath(post));
}
