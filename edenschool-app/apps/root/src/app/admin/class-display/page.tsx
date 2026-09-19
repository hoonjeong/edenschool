import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import ClassDisplayClient from './ClassDisplayClient';

export default async function ClassDisplayPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;
  return <ClassDisplayClient />;
}
