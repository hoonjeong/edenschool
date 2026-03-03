import { requireAdminSession } from '@/lib/admin-session';
import { PrevTestAddForm } from './PrevTestAddForm';

export default async function PrevTestAddPage() {
  await requireAdminSession();
  return <PrevTestAddForm />;
}
