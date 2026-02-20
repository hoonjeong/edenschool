import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectTestPlanByStudentId } from '@edenschool/common/queries/test';
import { SearchTable } from '@/components/SearchTable';

export default async function TestPage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/test');

  const list = await selectTestPlanByStudentId(session.user.studentId!);

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>테스트</h2>
        <p>테스트 목록입니다.</p>
      </div>
      <SearchTable>
        <table className="eden-table">
          <thead>
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
              <tr key={item.id}>
                <td className="text-center">{list.length - i}</td>
                <td><a href={`/test-view?id=${item.id}`}>{item.subject}</a></td>
                <td className="text-center">{item.date}</td>
                <td className="text-center">{item.count}</td>
                <td className="text-center">{item.resultCount ?? 0}</td>
                <td className="text-center">{item.correctCount ?? 0}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr className="eden-empty"><td colSpan={6}>테스트가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </SearchTable>
    </div>
  );
}
