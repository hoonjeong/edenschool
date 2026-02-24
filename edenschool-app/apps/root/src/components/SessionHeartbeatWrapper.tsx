import { getSession } from '@/lib/session';
import { SessionHeartbeat } from './SessionHeartbeat';

export async function SessionHeartbeatWrapper() {
  const session = await getSession();

  // 로그인한 학생만 하트비트 전송
  if (!session.user) return null;

  return <SessionHeartbeat />;
}
