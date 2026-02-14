import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectSchoolLectureList } from '@edenschool/common/queries/class';
import { SearchTable } from '@/components/SearchTable';

export default async function SchoolLecturePage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/school-lecture');

  const list = await selectSchoolLectureList();

  return (
    <div className="container mt-4">
      <h4>내신 수업</h4>
      <SearchTable>
        <table className="table table-hover table-sm">
          <thead className="thead-dark">
            <tr>
              <th>#</th>
              <th>수업명</th>
              <th>요일</th>
              <th>시간</th>
              <th>선생님</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={item.id}>
                <td>{i + 1}</td>
                <td>{item.name}</td>
                <td>{item.day}</td>
                <td>{String(item.hour).padStart(2, '0')}:{String(item.minute).padStart(2, '0')}</td>
                <td>{item.teacherOne}{item.teacherTwo ? `, ${item.teacherTwo}` : ''}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} className="text-center">수업 정보가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </SearchTable>
    </div>
  );
}
