import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import { MockSectionAddForm } from './MockSectionAddForm';

export default async function MockSectionAddPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;
  return <MockSectionAddForm />;
}
