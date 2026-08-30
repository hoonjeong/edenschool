import { selectQnaPostList } from '@edenschool/common/queries/qna';
import { getSession } from '@/lib/session';
import { BoardList } from '@/components/BoardList';
import { BoardTabs } from '@/components/BoardTabs';
import { toBoardItem } from '@/lib/board';
import { QnaWriteButton } from './QnaWriteButton';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import type { Metadata } from 'next';

const QNA_DESCRIPTION = '이든배움국어학원 질문게시판 - 국어 학습 중 생긴 질문을 선생님께 직접 묻고 답변을 받습니다.';

export async function generateMetadata(): Promise<Metadata> {
  const url = `${await getSiteUrl()}/qna`;
  const title = `질문게시판 - ${SITE_NAME}`;
  return {
    title,
    description: QNA_DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title, description: QNA_DESCRIPTION, type: 'website', url },
  };
}

export default async function QnaPage() {
  const list = await selectQnaPostList();
  const session = await getSession();
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

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <QnaWriteButton isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
