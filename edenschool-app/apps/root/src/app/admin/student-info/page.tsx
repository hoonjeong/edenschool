import { requireAdminSession } from '@/lib/admin-session';
import { selectStudentById } from '@edenschool/common/queries/student';
import { selectClassInfoByStudentId, selectClassInfoLive } from '@edenschool/common/queries/class';
import { selectStudentMemos, selectStudentScores } from '@edenschool/common/queries/student-record';
import StudentInfoClient from './StudentInfoClient';
import StudentMemoSection from './StudentMemoSection';
import StudentScoreSection from './StudentScoreSection';

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

  const sid = Number(studentId);
  const classList = await selectClassInfoByStudentId(sid);
  const classNames = await selectClassInfoLive();

  const [memos, naesinScores, mockScores] = await Promise.all([
    selectStudentMemos(sid),
    selectStudentScores(sid, 'naesin'),
    selectStudentScores(sid, 'mock'),
  ]);

  return (
    <div>
      <StudentInfoClient
        student={student}
        classList={classList}
        classNames={classNames}
      />

      <hr className="my-4" />

      <StudentMemoSection studentId={sid} initialMemos={memos} />

      <StudentScoreSection
        studentId={sid}
        category="naesin"
        title="내신 성적 관리"
        nameLabel="내신시험명"
        initialScores={naesinScores}
      />

      <StudentScoreSection
        studentId={sid}
        category="mock"
        title="모의고사 성적 관리"
        nameLabel="모의고사명"
        initialScores={mockScores}
      />
    </div>
  );
}
