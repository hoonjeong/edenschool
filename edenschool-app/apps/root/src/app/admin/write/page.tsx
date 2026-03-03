import { requireAdminSession } from '@/lib/admin-session';
import { WriteForm } from './WriteForm';

export default async function WritePage() {
  await requireAdminSession();
  return <WriteForm />;
}
