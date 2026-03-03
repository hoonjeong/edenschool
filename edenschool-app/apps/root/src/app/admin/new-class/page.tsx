import { requireAdminSession } from '@/lib/admin-session';
import { NewClassClient } from './NewClassClient';

export default async function NewClassPage() {
  await requireAdminSession();
  return <NewClassClient />;
}
