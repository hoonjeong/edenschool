import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const session = await getSession();
  if (session.user) redirect('/');

  const cookieStore = await cookies();
  const savedEmail = cookieStore.get('saved-email')?.value || '';
  return <LoginForm savedEmail={savedEmail} />;
}
