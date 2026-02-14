import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectTestPlanByStudentId } from '@edenschool/common/queries/test';
import { SearchTable } from '@/components/SearchTable';

export default async function TestPage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/test');

  const list = await selectTestPlanByStudentId(session.user.studentId!);

  return (
    <div className="container mt-4">
      <h4>테스트</h4>
      <SearchTable>
        <table className="table table-hover table-sm">
          <thead className="thead-dark">
            <tr>
              <th>#</th>
              <th>테스트명</th>
              <th>날짜</th>
              <th>문항수</th>
              <th>제출</th>
              <th>정답</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={item.id} style={{ cursor: 'pointer' }}>
                <td>{list.length - i}</td>
                <td><a href={`/test-view?id=${item.id}`}>{item.subject}</a></td>
                <td>{item.date}</td>
                <td>{item.count}</td>
                <td>{item.resultCount ?? 0}</td>
                <td>{item.correctCount ?? 0}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="text-center">테스트가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </SearchTable>
    </div>
  );
}
