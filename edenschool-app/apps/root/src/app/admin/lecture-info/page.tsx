import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-session';
import { selectLectureList } from '@edenschool/common/queries/lecture';
import LectureSearch from './LectureSearch';

interface LectureRow {
  id: number;
  subject: string;
  className: string;
  teacher: string;
  date: string;
  code: string;
}

export default async function LectureInfoPage() {
  const session = await requireAdminSession();

  const rawLectures = await selectLectureList();

  // Map lectureDate -> date for template compatibility
  const lectures: LectureRow[] = rawLectures.map((l) => ({
    id: l.id,
    subject: l.subject,
    className: l.className || '',
    teacher: l.teacher,
    date: l.lectureDate,
    code: l.code,
  }));

  return (
    <div>
      <h4 className="mb-3">강의 관리</h4>

      <div className="mb-3 d-flex justify-content-between align-items-center">
        <Link href="/admin/insert-lecture" className="btn btn-primary">
          강의 등록
        </Link>
      </div>

      <LectureSearch lectures={lectures} />
    </div>
  );
}
