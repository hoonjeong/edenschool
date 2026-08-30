import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/admin-session';
import { selectClassInfoById } from '@edenschool/common/queries/class';
import { selectStudentListByClassId } from '@edenschool/common/queries/student';
import { AttendanceExcelButton } from '@/components/AttendanceExcelButton';
import { toId } from '@/lib/params';

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function TeacherStudentListPage({ searchParams }: Props) {
  const session = await requireAdminSession();

  const params = await searchParams;
  const classId = toId(params.id);
  if (!classId) redirect('/admin/student-manage');

  const classInfo = await selectClassInfoById(classId);
  if (!classInfo) redirect('/admin/student-manage');

  const studentList = await selectStudentListByClassId(classId);

  return (
    <div>
      <h4>{classInfo.name} 학생 명단</h4>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <a href="/admin/student-manage" className="btn btn-secondary">뒤로가기</a>
        <AttendanceExcelButton classId={classId} />
      </div>
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
