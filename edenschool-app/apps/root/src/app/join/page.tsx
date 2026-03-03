import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { JoinForm } from './JoinForm';

export default async function JoinPage() {
  const session = await getSession();
  if (session.user) redirect('/');
  return <JoinForm />;
}
