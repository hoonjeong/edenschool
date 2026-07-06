import { selectQnaPostList } from '@edenschool/common/queries/qna';
import { getSession } from '@/lib/session';
import { BoardList } from '@/components/BoardList';
import { stripHtml } from '@/lib/sanitize';
import { QnaWriteButton } from './QnaWriteButton';

function toPreview(html?: string): string {
  if (!html) return '';
  const text = stripHtml(html);
  return text.length > 160 ? text.slice(0, 160) + '…' : text;
}

const BOARD_CATEGORIES = [
  { code: 'N', label: '공지사항', href: '/board?category=N' },
  { code: 'S', label: '이든이야기', href: '/board?category=S' },
  { code: 'C', label: '입시정보', href: '/board?category=C' },
  { code: 'D', label: '입시자료', href: '/board?category=D' },
  { code: 'R', label: '수강후기', href: '/board?category=R' },
];

export default async function QnaPage() {
  const list = await selectQnaPostList();
  const session = await getSession();
  const isLoggedIn = !!session.user;

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>게시판</h2>
      </div>

      {/* 카테고리 탭 */}
      <div className="eden-tabs">
        {BOARD_CATEGORIES.map((cat) => (
          <a key={cat.code} href={cat.href} className="eden-tab">
            {cat.label}
          </a>
        ))}
        <a href="/qna" className="eden-tab active">
          질문게시판
        </a>
      </div>

      <BoardList
        items={list.map((item) => ({
          id: item.id,
          subject: item.subject,
          href: `/qna/${item.id}`,
          preview: toPreview(item.contents),
          commentCount: item.commentCount ?? 0,
        }))}
        emptyText="질문이 없습니다."
      />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <QnaWriteButton isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
