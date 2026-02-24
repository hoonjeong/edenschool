import { cookies } from 'next/headers';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const savedEmail = cookieStore.get('saved-email')?.value || '';
  return <LoginForm savedEmail={savedEmail} />;
}
