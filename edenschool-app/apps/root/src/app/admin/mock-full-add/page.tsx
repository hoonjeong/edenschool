import { requireAdminSession } from '@/lib/admin-session';
import { MockFullAddForm } from './MockFullAddForm';

export default async function MockFullAddPage() {
  await requireAdminSession();
  return <MockFullAddForm />;
}
