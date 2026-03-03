import { requireAdminSession } from '@/lib/admin-session';
import { TeacherSmsClient } from './TeacherSmsClient';

export default async function TeacherSmsPage() {
  await requireAdminSession();
  return <TeacherSmsClient />;
}
