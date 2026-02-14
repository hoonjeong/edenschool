import { requireAdminSession } from '@/lib/admin-session';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  await requireAdminSession();

  return <DashboardClient />;
}
