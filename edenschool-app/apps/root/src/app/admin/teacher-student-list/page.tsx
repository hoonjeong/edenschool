import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/admin-session';
import { selectClassInfoById } from '@edenschool/common/queries/class';
import { selectStudentListByClassId } from '@edenschool/common/queries/student';

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function TeacherStudentListPage({ searchParams }: Props) {
  const session = await requireAdminSession();

  const params = await searchParams;
  const classId = params.id;
  if (!classId) redirect('/admin/student-manage');

  const classInfo = await selectClassInfoById(Number(classId));
  if (!classInfo) redirect('/admin/student-manage');

  const studentList = await selectStudentListByClassId(Number(classId));

  return (
    <div>
      <h4>{classInfo.name} 학생 명단</h4>
      <a href="/admin/student-manage" className="btn btn-secondary mb-3">뒤로가기</a>
      <table className="table table-bordered table-striped">
        <thead>
          <tr>
            <th>이름</th>
            <th>학교</th>
            <th>학년</th>
            <th>학생연락처</th>
            <th>학부모연락처</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {studentList.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.school}</td>
              <td>{s.grade}{s.year}</td>
              <td>{s.sphone}</td>
              <td>{s.pphone}</td>
              <td>
                <a href={`/admin/teacher-student-info?id=${s.id}`} className="btn btn-sm btn-primary">상세</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
