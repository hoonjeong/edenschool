import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/admin-session';
import { selectStudentById } from '@edenschool/common/queries/student';
import { selectClassInfoByStudentId, selectClassInfoLive } from '@edenschool/common/queries/class';
import { selectStudentMemos } from '@edenschool/common/queries/student-record';
import StudentInfoClient from './StudentInfoClient';
import StudentMemoSection from './StudentMemoSection';

export default async function StudentInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await requireAdminSession();
  // 원장 전용 페이지 — 선생님은 선생님용 상세(teacher-student-info)로 유도
  if (session.user.code !== 'O') redirect('/admin/student-manage');

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

  const sid = Number(studentId);
  const classList = await selectClassInfoByStudentId(sid);
  const classNames = await selectClassInfoLive();

  const memos = await selectStudentMemos(sid);

  return (
    <div>
      <StudentInfoClient
        student={student}
        classList={classList}
        classNames={classNames}
      />

      <hr className="my-4" />

      <StudentMemoSection initialMemos={memos} />
    </div>
  );
}
