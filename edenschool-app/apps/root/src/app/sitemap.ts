import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
import { selectPostSitemap } from '@edenschool/common/queries/post';
import { selectQnaSitemap } from '@edenschool/common/queries/qna';
import { ALL_CATEGORY, BOARD_CATEGORIES, boardListPath, boardPostPath, encodePathname } from '@/lib/board';

// DB 조회 + 요청 host 기반 URL이 필요하므로 요청 시 생성
export const dynamic = 'force-dynamic';

function toDate(d?: string): Date | undefined {
  if (!d) return undefined;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, posts, qnas] = await Promise.all([
    getSiteUrl(),
    selectPostSitemap().catch(() => []),
    selectQnaSitemap().catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${site}/about/expertise`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site}/about/clinic`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site}/qna`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${site}/class-video`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // 게시판 전체보기 + 카테고리 목록 5종 (/board 는 301 되므로 등록하지 않는다)
  const categoryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${site}${boardListPath(ALL_CATEGORY.slug)}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    ...BOARD_CATEGORIES.map((cat) => ({
      url: `${site}${boardListPath(cat.slug)}`,
      changeFrequency: 'daily' as const,
      priority: cat.code === 'N' ? 0.8 : 0.7,
    })),
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${site}${encodePathname(boardPostPath(p))}`,
    lastModified: toDate(p.date),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const qnaRoutes: MetadataRoute.Sitemap = qnas.map((q) => ({
    url: `${site}/qna/${q.id}`,
    lastModified: toDate(q.date),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...postRoutes, ...qnaRoutes];
}
