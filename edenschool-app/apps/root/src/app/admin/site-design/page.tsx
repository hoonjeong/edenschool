import { requireAdminSession } from '@/lib/admin-session';
import { SiteDesignForm } from './SiteDesignForm';

export default async function SiteDesignPage() {
  await requireAdminSession();
  return <SiteDesignForm />;
}
