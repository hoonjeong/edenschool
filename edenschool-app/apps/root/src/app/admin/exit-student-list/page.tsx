import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/admin-session';
import { selectAllExitedStudents } from '@edenschool/common/queries/student';
import ExitStudentListClient from './ExitStudentListClient';

// 운영진(원장 code='O') 전용 퇴원생 관리(검색 + 재등록).
export default async function ExitStudentListPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') redirect('/admin/student-manage');

  const students = await selectAllExitedStudents();

  return <ExitStudentListClient students={students} />;
}
