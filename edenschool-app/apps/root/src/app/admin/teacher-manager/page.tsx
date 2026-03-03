import { requireAdminSession } from '@/lib/admin-session';
import { TeacherManagerClient } from './TeacherManagerClient';

export default async function TeacherManagerPage() {
  await requireAdminSession();
  return <TeacherManagerClient />;
}
