import { selectPostInfoList } from '@edenschool/common/queries/post';
import { SearchTable } from '@/components/SearchTable';

export default async function BoardPage() {
  const list = await selectPostInfoList('B');

  return (
    <div className="container mt-4">
      <h4>게시판</h4>
      <SearchTable>
        <table className="table table-hover table-sm">
          <thead className="thead-dark">
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
              <tr key={item.id} style={{ cursor: 'pointer' }}>
                <td>{list.length - i}</td>
                <td><a href={`/post-view?id=${item.id}`}>{item.subject}</a></td>
                <td>{item.writer ?? '-'}</td>
                <td>{item.date}</td>
                <td>{item.commentCount ?? 0}</td>
                <td>{item.readCount}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="text-center">게시글이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </SearchTable>
    </div>
  );
}
