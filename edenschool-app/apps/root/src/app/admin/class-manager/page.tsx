import { requireAdminSession } from '@/lib/admin-session';
import { selectClassInfoAll } from '@edenschool/common/queries/class';
import ClassManagerClient, { type ClassRow } from './ClassManagerClient';

export default async function ClassManagerPage() {
  await requireAdminSession();

  const classList = (await selectClassInfoAll()) as unknown as ClassRow[];

  return <ClassManagerClient classList={classList} />;
}
