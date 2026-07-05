import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-session';
import { searchLectureList } from '@edenschool/common/queries/lecture';
import LectureSearch from './LectureSearch';

interface LectureRow {
  id: number;
  subject: string;
  className: string;
  teacher: string;
  date: string;
  code: string;
}

export default async function LectureInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const search = params.search || '';
  const page = Number(params.page) || 1;
  const pageSize = 50;

  const { list, total } = await searchLectureList({ search, page, pageSize });

  const lectures: LectureRow[] = list.map((l) => ({
    id: l.id,
    subject: l.subject,
    className: l.className || '',
    teacher: l.teacher,
    date: l.lectureDate,
    code: l.code,
  }));

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h4 className="mb-3">강의 관리</h4>

      <div className="mb-3">
        <Link href="/admin/insert-lecture" className="btn btn-primary">
          강의 등록
        </Link>
      </div>

      <LectureSearch
        lectures={lectures}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
      />
    </div>
  );
}
