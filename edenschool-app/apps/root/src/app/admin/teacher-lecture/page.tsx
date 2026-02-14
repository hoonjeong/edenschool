import { requireAdminSession } from '@/lib/admin-session';
import { selectLectureListByAdminName } from '@edenschool/common/queries/lecture';
import TeacherLectureList from './TeacherLectureList';

export default async function TeacherLecturePage() {
  const session = await requireAdminSession();

  const teacher = session.user.name;
  const lectures = await selectLectureListByAdminName(teacher);

  return (
    <div>
      <h3>{teacher}님 강의 목록입니다.</h3>
      <TeacherLectureList lectures={lectures} />
    </div>
  );
}
