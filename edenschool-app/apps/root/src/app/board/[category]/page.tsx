import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { selectPostInfoList, selectPostInfoCount } from '@edenschool/common/queries/post';
import { BoardList } from '@/components/BoardList';
import { BoardTabs } from '@/components/BoardTabs';
import { BoardPagination } from '@/components/BoardPagination';
import {
  ALL_CATEGORY,
  BOARD_PAGE_SIZE,
  BOARD_ROOT_PATH,
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

/**
 * 슬러그 → 목록 대상.
 * 'all' 은 DB 카테고리가 아니라 "필터 없음"을 뜻하므로 code 를 undefined 로 돌려준다.
 */
function resolveTarget(slug: string): { label: string; description: string; slug: string; code?: string } | null {
  if (slug === ALL_CATEGORY.slug) return { ...ALL_CATEGORY };
  const cat = categoryBySlug(slug);
  return cat ? { label: cat.label, description: cat.description, slug: cat.slug, code: cat.code } : null;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const target = resolveTarget(category);
  if (!target) return { title: `게시판 - ${SITE_NAME}` };

  const page = toPageNumber((await searchParams).page);
  const site = await getSiteUrl();
  // 페이지네이션 각 페이지는 자기 자신을 canonical 로 둔다(1페이지로 합치면 2페이지 이후가 색인되지 않음).
  const url = `${site}${boardListPath(target.slug, page)}`;
  const title = page > 1
    ? `${target.label} (${page}페이지) - ${SITE_NAME}`
    : `${target.label} - ${SITE_NAME}`;

  return {
    title,
    description: target.description,
    alternates: { canonical: url },
    openGraph: { title, description: target.description, type: 'website', url },
  };
}

export default async function BoardCategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const target = resolveTarget(category);
  if (!target) notFound();

  const page = toPageNumber((await searchParams).page);
  // code 가 없으면(전체보기) 카테고리 필터 없이 전체를 id 역순(최신순)으로 가져온다.
  const total = await selectPostInfoCount('P', target.code);
  const totalPages = Math.max(1, Math.ceil(total / BOARD_PAGE_SIZE));
  if (page > totalPages) notFound();

  const list = await selectPostInfoList('P', target.code, BOARD_PAGE_SIZE, (page - 1) * BOARD_PAGE_SIZE);
  const site = await getSiteUrl();

  // 사이트 구조를 검색엔진에 명시 (게시판 › 카테고리).
  // 전체보기는 게시판 최상위 자신이므로 단계를 하나만 둔다.
  const isAll = target.slug === ALL_CATEGORY.slug;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '게시판', item: `${site}${BOARD_ROOT_PATH}` },
      ...(isAll
        ? []
        : [{ '@type': 'ListItem', position: 2, name: target.label, item: `${site}${boardListPath(target.slug)}` }]),
    ],
  };

  return (
    <div className="eden-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
      />

      <BoardTabs active={target.slug} />

      <BoardList items={list.map((item) => toBoardItem(item, boardPostPath(item)))} />

      <BoardPagination basePath={boardListPath(target.slug)} page={page} totalPages={totalPages} />
    </div>
  );
}
