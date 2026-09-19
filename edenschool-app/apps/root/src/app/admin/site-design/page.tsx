import { requireAdminSession } from '@/lib/admin-session';
import { AdminAccessDenied } from '@/components/AdminAccessDenied';
import { SiteDesignForm } from './SiteDesignForm';

export default async function SiteDesignPage() {
  const session = await requireAdminSession();
  if (session.user.code !== 'O') return <AdminAccessDenied />;
  return <SiteDesignForm />;
}
