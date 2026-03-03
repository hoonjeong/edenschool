import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { FindEmailForm } from './FindEmailForm';

export default async function FindEmailPage() {
  const session = await getSession();
  if (session.user) redirect('/');
  return <FindEmailForm />;
}
