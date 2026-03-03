import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { FindPassForm } from './FindPassForm';

export default async function FindPassPage() {
  const session = await getSession();
  if (session.user) redirect('/');
  return <FindPassForm />;
}
