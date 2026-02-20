import { selectPostInfoList } from '@edenschool/common/queries/post';
import { SearchTable } from '@/components/SearchTable';

const CATEGORIES = [
  { code: 'N', label: '공지사항' },
  { code: 'S', label: '이든이야기' },
  { code: 'C', label: '입시정보' },
  { code: 'D', label: '입시자료' },
  { code: 'R', label: '수강후기' },
];

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || 'N';
  const list = await selectPostInfoList('P', category);

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>게시판</h2>
      </div>

      {/* 카테고리 탭 */}
      <div className="eden-tabs">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.code}
            href={`/board?category=${cat.code}`}
            className={`eden-tab${category === cat.code ? ' active' : ''}`}
          >
            {cat.label}
          </a>
        ))}
        <a href="/qna" className="eden-tab">
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
              <th>댓글</th>
              <th>조회</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={item.id}>
                <td className="text-center">{list.length - i}</td>
                <td><a href={`/post-view?id=${item.id}`}>{item.subject}</a></td>
                <td className="text-center">{item.writer ?? '-'}</td>
                <td className="text-center">{item.date}</td>
                <td className="text-center">{item.commentCount ?? 0}</td>
                <td className="text-center">{item.readCount}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr className="eden-empty"><td colSpan={6}>게시글이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </SearchTable>
    </div>
  );
}
