import { requireAdminSession } from '@/lib/admin-session';
import { selectStudentById } from '@edenschool/common/queries/student';
import { selectClassInfoByStudentId, selectClassInfoLive } from '@edenschool/common/queries/class';
import StudentInfoClient from './StudentInfoClient';

export default async function StudentInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireAdminSession();

  const params = await searchParams;
  const studentId = params.id;

  if (!studentId) {
    return (
      <div>
        <div className="alert alert-warning">학생 ID가 필요합니다.</div>
      </div>
    );
  }

  const student = await selectStudentById(Number(studentId));

  if (!student) {
    return (
      <div>
        <div className="alert alert-danger">학생 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const classList = await selectClassInfoByStudentId(Number(studentId));

  const classNames = await selectClassInfoLive();

  return (
    <div>
      <StudentInfoClient
        student={student}
        classList={classList}
        classNames={classNames}
      />
    </div>
  );
}
