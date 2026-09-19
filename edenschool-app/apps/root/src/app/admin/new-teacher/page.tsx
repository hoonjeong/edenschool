import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import { NewTeacherForm } from './NewTeacherForm';

export default async function NewTeacherPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;
  return <NewTeacherForm />;
}
