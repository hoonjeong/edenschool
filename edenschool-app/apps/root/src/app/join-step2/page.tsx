import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { JoinStep2Form } from './JoinStep2Form';

export default async function JoinStep2Page() {
  const session = await getSession();
  if (session.user) redirect('/');
  return <JoinStep2Form />;
}
