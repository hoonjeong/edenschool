import { cookies } from 'next/headers';
import { LoginForm } from './LoginForm';

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const savedEmail = cookieStore.get('saved-admin-email')?.value || '';
  return <LoginForm savedEmail={savedEmail} />;
}
