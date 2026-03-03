import { requireAdminSession } from '@/lib/admin-session';
import { SplitFileAddForm } from './SplitFileAddForm';

export default async function SplitFileAddPage() {
  await requireAdminSession();
  return <SplitFileAddForm />;
}
