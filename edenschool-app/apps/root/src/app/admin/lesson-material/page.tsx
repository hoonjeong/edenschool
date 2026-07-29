import { requireAdminSession } from '@/lib/admin-session';
import LessonMaterialClient from './LessonMaterialClient';
import './lesson-material.css';

export default async function LessonMaterialPage() {
  await requireAdminSession();

  return (
    <div>
      <h4 className="mb-3">수업자료생성</h4>
      <LessonMaterialClient />
    </div>
  );
}
