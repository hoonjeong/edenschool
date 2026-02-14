import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectUserAllInfoById, selectUserClassInfoById } from '@edenschool/common/queries/user';
import { MyInfoClient } from './MyInfoClient';

export default async function MyInfoPage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/myinfo');

  const userInfo = await selectUserAllInfoById(session.user.id);
  const classList = await selectUserClassInfoById(session.user.id);

  return <MyInfoClient userInfo={userInfo} classList={classList} userId={session.user.id} />;
}
