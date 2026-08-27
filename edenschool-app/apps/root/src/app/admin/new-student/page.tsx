import { requireAdminSession } from '@/lib/admin-session';
import { NewStudentForm } from './NewStudentForm';

export default async function NewStudentPage() {
  await requireAdminSession();
  return <NewStudentForm />;
}
