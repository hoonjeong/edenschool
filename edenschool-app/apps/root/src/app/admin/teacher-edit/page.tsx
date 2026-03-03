import { requireAdminSession } from '@/lib/admin-session';
import { TeacherEditForm } from './TeacherEditForm';

export default async function TeacherEditPage() {
  await requireAdminSession();
  return <TeacherEditForm />;
}
