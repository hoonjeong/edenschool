import { requireAdminSession } from '@/lib/admin-session';
import { SitePopupForm } from './SitePopupForm';

export default async function SitePopupPage() {
  await requireAdminSession();
  return <SitePopupForm />;
}
