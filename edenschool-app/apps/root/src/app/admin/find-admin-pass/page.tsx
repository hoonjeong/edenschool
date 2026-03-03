import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';
import { FindAdminPassForm } from './FindAdminPassForm';

export default async function FindAdminPassPage() {
  const session = await getAdminSession();
  if (session.user) redirect('/admin');
  return <FindAdminPassForm />;
}
