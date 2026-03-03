import { requireAdminSession } from '@/lib/admin-session';
import { NewTeacherForm } from './NewTeacherForm';

export default async function NewTeacherPage() {
  await requireAdminSession();
  return <NewTeacherForm />;
}
