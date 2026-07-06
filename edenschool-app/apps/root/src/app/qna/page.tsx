import { selectQnaPostList } from '@edenschool/common/queries/qna';
import { getSession } from '@/lib/session';
import { BoardList } from '@/components/BoardList';
import { BoardTabs } from '@/components/BoardTabs';
import { toBoardItem } from '@/lib/board';
import { QnaWriteButton } from './QnaWriteButton';

export default async function QnaPage() {
  const list = await selectQnaPostList();
  const session = await getSession();
  const isLoggedIn = !!session.user;

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>게시판</h2>
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
