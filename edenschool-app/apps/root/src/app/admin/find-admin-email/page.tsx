import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';
import { FindAdminEmailForm } from './FindAdminEmailForm';

export default async function FindAdminEmailPage() {
  const session = await getAdminSession();
  if (session.user) redirect('/admin');
  return <FindAdminEmailForm />;
}
