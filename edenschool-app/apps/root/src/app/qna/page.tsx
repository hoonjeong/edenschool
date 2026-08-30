import { selectQnaPostList, selectQnaPostCount } from '@edenschool/common/queries/qna';
import { getSession } from '@/lib/session';
import { notFound } from 'next/navigation';
import { BoardList } from '@/components/BoardList';
import { BoardTabs } from '@/components/BoardTabs';
import { BoardPagination } from '@/components/BoardPagination';
import { BOARD_PAGE_SIZE, pagePath, toBoardItem, toPageNumber } from '@/lib/board';
import { QnaWriteButton } from './QnaWriteButton';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import type { Metadata } from 'next';

const QNA_DESCRIPTION = '이든배움국어학원 질문게시판 - 국어 학습 중 생긴 질문을 선생님께 직접 묻고 답변을 받습니다.';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const page = toPageNumber((await searchParams).page);
  // 페이지네이션 각 페이지는 자기 자신을 canonical 로 둔다(1페이지로 합치면 2페이지 이후가 색인되지 않음).
  const url = `${await getSiteUrl()}${pagePath('/qna', page)}`;
  const title = page > 1
    ? `질문게시판 (${page}페이지) - ${SITE_NAME}`
    : `질문게시판 - ${SITE_NAME}`;

  return {
    title,
    description: QNA_DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title, description: QNA_DESCRIPTION, type: 'website', url },
  };
}

export default async function QnaPage({ searchParams }: PageProps) {
  const page = toPageNumber((await searchParams).page);

  const total = await selectQnaPostCount();
  const totalPages = Math.max(1, Math.ceil(total / BOARD_PAGE_SIZE));
  if (page > totalPages) notFound();

  const [list, session] = await Promise.all([
    selectQnaPostList(BOARD_PAGE_SIZE, (page - 1) * BOARD_PAGE_SIZE),
    getSession(),
  ]);
  const isLoggedIn = !!session.user;

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h1>질문게시판</h1>
        <p>{QNA_DESCRIPTION}</p>
      </div>

      <BoardTabs active="qna" />

      <BoardList
        items={list.map((item) => toBoardItem(item, `/qna/${item.id}`))}
        emptyText="질문이 없습니다."
      />

      <BoardPagination basePath="/qna" page={page} totalPages={totalPages} />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <QnaWriteButton isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
