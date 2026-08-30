import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { selectPostInfoList, selectPostInfoCount } from '@edenschool/common/queries/post';
import { BoardList } from '@/components/BoardList';
import { BoardTabs } from '@/components/BoardTabs';
import { BoardPagination } from '@/components/BoardPagination';
import {
  BOARD_PAGE_SIZE,
  boardListPath,
  boardPostPath,
  categoryBySlug,
  toBoardItem,
  toPageNumber,
} from '@/lib/board';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) return { title: `게시판 - ${SITE_NAME}` };

  const page = toPageNumber((await searchParams).page);
  const site = await getSiteUrl();
  // 페이지네이션 각 페이지는 자기 자신을 canonical 로 둔다(1페이지로 합치면 2페이지 이후가 색인되지 않음).
  const url = `${site}${boardListPath(cat.slug, page)}`;
  const title = page > 1
    ? `${cat.label} (${page}페이지) - ${SITE_NAME}`
    : `${cat.label} - ${SITE_NAME}`;

  return {
    title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: { title, description: cat.description, type: 'website', url },
  };
}

export default async function BoardCategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) notFound();

  const page = toPageNumber((await searchParams).page);
  const total = await selectPostInfoCount('P', cat.code);
  const totalPages = Math.max(1, Math.ceil(total / BOARD_PAGE_SIZE));
  if (page > totalPages) notFound();

  const list = await selectPostInfoList('P', cat.code, BOARD_PAGE_SIZE, (page - 1) * BOARD_PAGE_SIZE);
  const site = await getSiteUrl();

  // 사이트 구조를 검색엔진에 명시 (게시판 › 카테고리)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '게시판', item: `${site}/board/notice` },
      { '@type': 'ListItem', position: 2, name: cat.label, item: `${site}${boardListPath(cat.slug)}` },
    ],
  };

  return (
    <div className="eden-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="eden-page-header">
        <h1>{cat.label}</h1>
        <p>{cat.description}</p>
      </div>

      <BoardTabs active={cat.slug} />

      <BoardList items={list.map((item) => toBoardItem(item, boardPostPath(item)))} />

      <BoardPagination basePath={boardListPath(cat.slug)} page={page} totalPages={totalPages} />
    </div>
  );
}
