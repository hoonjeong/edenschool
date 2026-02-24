import { selectQnaPostList } from '@edenschool/common/queries/qna';
import { getSession } from '@/lib/session';
import { SearchTable } from '@/components/SearchTable';
import { QnaWriteButton } from './QnaWriteButton';

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

      <SearchTable>
        <table className="eden-table">
          <thead>
            <tr>
              <th>#</th>
              <th>제목</th>
              <th>작성자</th>
              <th>날짜</th>
              <th>조회</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={item.id}>
                <td className="text-center">{list.length - i}</td>
                <td>
                  <a href={`/qna/${item.id}`}>
                    {item.subject}
                    {(item.commentCount ?? 0) > 0 && (
                      <span style={{ color: 'red', fontWeight: 'bold', marginLeft: 4 }}>
                        ({item.commentCount})
                      </span>
                    )}
                  </a>
                </td>
                <td className="text-center">{item.writer ?? '-'}</td>
                <td className="text-center">{item.date}</td>
                <td className="text-center">{item.readCount}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr className="eden-empty">
                <td colSpan={5}>게시글이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </SearchTable>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <QnaWriteButton isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
