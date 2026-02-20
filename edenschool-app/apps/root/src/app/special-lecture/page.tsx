import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectSpecialLectureListByStudentId } from '@edenschool/common/queries/lecture';
import { SearchTable } from '@/components/SearchTable';

export default async function SpecialLecturePage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/special-lecture');

  const list = await selectSpecialLectureListByStudentId(session.user.studentId!);

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>특강</h2>
        <p>특강 강의 목록입니다.</p>
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
              <tr className="eden-empty"><td colSpan={4}>특강이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </SearchTable>
    </div>
  );
}
