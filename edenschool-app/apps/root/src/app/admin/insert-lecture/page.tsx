import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import { InsertLectureForm } from './InsertLectureForm';

export default async function InsertLecturePage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;
  return <InsertLectureForm />;
}
