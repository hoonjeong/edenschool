import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';
import { LoginForm } from './LoginForm';

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session.user) redirect('/admin');

  const cookieStore = await cookies();
  const savedEmail = cookieStore.get('saved-admin-email')?.value || '';
  return <LoginForm savedEmail={savedEmail} />;
}
