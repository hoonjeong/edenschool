import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import { selectClassInfoAll } from '@edenschool/common/queries/class';
import ClassManagerClient, { type ClassRow } from './ClassManagerClient';

export default async function ClassManagerPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;

  const classList = (await selectClassInfoAll()) as unknown as ClassRow[];

  return <ClassManagerClient classList={classList} />;
}
