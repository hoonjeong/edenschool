import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';
import { AdminJoinForm } from './AdminJoinForm';

export default async function AdminJoinPage() {
  const session = await getAdminSession();
  if (session.user) redirect('/admin');
  return <AdminJoinForm />;
}
