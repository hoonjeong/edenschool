import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session.user) {
    redirect('/admin/login');
  }

  // 운영자(O)는 통계 페이지로 바로 이동
  if (session.user.code === 'O') {
    redirect('/admin/statistics');
  }

  return <DashboardClient />;
}
