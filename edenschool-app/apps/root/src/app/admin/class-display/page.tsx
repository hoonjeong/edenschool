import { requireAdminSession } from '@/lib/admin-session';
import ClassDisplayClient from './ClassDisplayClient';

export default async function ClassDisplayPage() {
  await requireAdminSession();
  return <ClassDisplayClient />;
}
