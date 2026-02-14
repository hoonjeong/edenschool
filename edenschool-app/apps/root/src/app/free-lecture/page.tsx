import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectLectureListByCode } from '@edenschool/common/queries/lecture';
import { SearchTable } from '@/components/SearchTable';

export default async function FreeLecturePage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/free-lecture');

  const list = await selectLectureListByCode('F');

  return (
    <div className="container mt-4">
      <h4>무료 강의</h4>
      <SearchTable>
        <table className="table table-hover table-sm">
          <thead className="thead-dark">
            <tr>
              <th>#</th>
              <th>강의명</th>
              <th>선생님</th>
              <th>날짜</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={item.id} style={{ cursor: 'pointer' }}>
                <td>{list.length - i}</td>
                <td><a href={`/lecture-view?id=${item.id}`}>{item.subject}</a></td>
                <td>{item.teacher}</td>
                <td>{item.lectureDate}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="text-center">강의가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </SearchTable>
    </div>
  );
}
