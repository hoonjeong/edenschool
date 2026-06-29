import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/admin-session';
import { selectAllActiveStudents } from '@edenschool/common/queries/student';
import StudentListClient from './StudentListClient';

// 운영진(원장 code='O') 전용 전체 학생 관리. 선생님은 담당반 관리(student-manage)로 보냄.
export default async function StudentListPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') redirect('/admin/student-manage');

  const students = await selectAllActiveStudents();

  return <StudentListClient students={students} />;
}
