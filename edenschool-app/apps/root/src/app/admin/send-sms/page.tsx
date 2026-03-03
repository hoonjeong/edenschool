import { requireAdminSession } from '@/lib/admin-session';
import { SendSmsClient } from './SendSmsClient';

export default async function SendSmsPage() {
  await requireAdminSession();
  return <SendSmsClient />;
}
