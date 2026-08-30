import { requireAdminSession } from '@/lib/admin-session';
import { selectStudentById } from '@edenschool/common/queries/student';
import { selectStudentMemos } from '@edenschool/common/queries/student-record';
import ClinicSection from './ClinicSection';
import { toId } from '@/lib/params';

export default async function TeacherStudentInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const studentId = toId(params.id);

  if (!studentId) {
    return (
      <div>
        <div className="alert alert-warning">학생 ID가 필요합니다.</div>
      </div>
    );
  }

  const student = await selectStudentById(studentId);

  if (!student) {
    return (
      <div>
        <div className="alert alert-danger">학생 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const sid = Number(studentId);
  const memos = await selectStudentMemos(sid);

  return (
    <div>
      {/* 학생 정보 (읽기 전용) */}
      <div className="col-md-6 px-0">
        <h5 className="mb-3">학생 정보</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th className="bg-light" style={{ width: '30%' }}>이름</th>
              <td>{student.name}</td>
            </tr>
            <tr>
              <th className="bg-light">학교/학년</th>
              <td>{student.school} {student.grade}{student.year}</td>
            </tr>
            <tr>
              <th className="bg-light">학생 연락처</th>
              <td>{student.sphone}</td>
            </tr>
            <tr>
              <th className="bg-light">학부모 연락처</th>
              <td>{student.pphone}</td>
            </tr>
            <tr>
              <th className="bg-light">특이사항</th>
              <td>{student.specialty}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr className="my-4" />

      <ClinicSection studentId={sid} parentPhone={student.pphone} initialMemos={memos} />
    </div>
  );
}
