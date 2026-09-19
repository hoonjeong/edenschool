import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import { TeacherManagerClient } from './TeacherManagerClient';

export default async function TeacherManagerPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;
  return <TeacherManagerClient />;
}
