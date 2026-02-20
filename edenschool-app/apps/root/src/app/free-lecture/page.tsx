import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectLectureListByCode } from '@edenschool/common/queries/lecture';
import { SearchTable } from '@/components/SearchTable';

export default async function FreeLecturePage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/free-lecture');

  const list = await selectLectureListByCode('F');

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>무료 강의</h2>
        <p>무료로 제공되는 강의 목록입니다.</p>
      </div>
      <SearchTable>
        <table className="eden-table">
          <thead>
            <tr>
              <th>#</th>
              <th>강의명</th>
              <th>선생님</th>
              <th>날짜</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={item.id}>
                <td className="text-center">{list.length - i}</td>
                <td><a href={`/lecture-view?id=${item.id}`}>{item.subject}</a></td>
                <td className="text-center">{item.teacher}</td>
                <td className="text-center">{item.lectureDate}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr className="eden-empty"><td colSpan={4}>강의가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </SearchTable>
    </div>
  );
}
