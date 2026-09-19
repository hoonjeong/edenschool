import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import { SitePopupForm } from './SitePopupForm';

export default async function SitePopupPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;
  return <SitePopupForm />;
}
