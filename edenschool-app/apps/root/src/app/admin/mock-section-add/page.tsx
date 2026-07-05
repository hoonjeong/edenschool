import { requireAdminSession } from '@/lib/admin-session';
import { MockSectionAddForm } from './MockSectionAddForm';

export default async function MockSectionAddPage() {
  await requireAdminSession();
  return <MockSectionAddForm />;
}
