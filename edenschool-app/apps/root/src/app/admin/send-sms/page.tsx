import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import { SendSmsClient } from './SendSmsClient';

export default async function SendSmsPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;
  return <SendSmsClient />;
}
