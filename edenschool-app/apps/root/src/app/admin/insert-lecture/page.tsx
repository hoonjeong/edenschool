import { requireAdminSession } from '@/lib/admin-session';
import { InsertLectureForm } from './InsertLectureForm';

export default async function InsertLecturePage() {
  await requireAdminSession();
  return <InsertLectureForm />;
}
