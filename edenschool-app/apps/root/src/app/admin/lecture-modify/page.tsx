import { requireAdminSession } from '@/lib/admin-session';
import { LectureModifyForm } from './LectureModifyForm';

export default async function LectureModifyPage() {
  await requireAdminSession();
  return <LectureModifyForm />;
}
