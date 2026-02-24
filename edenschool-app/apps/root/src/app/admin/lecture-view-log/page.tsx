import { requireAdminSession } from '@/lib/admin-session';
import { selectLectureViewLogs } from '@edenschool/common/queries/lecture-view-log';
import LectureViewLogClient from './LectureViewLogClient';

export default async function LectureViewLogPage() {
  await requireAdminSession();

  const logs = await selectLectureViewLogs(200);

  return (
    <div>
      <h3>영상 시청 기록</h3>
      <p className="text-muted">학생들의 강의 영상 시청 기록입니다.</p>
      <LectureViewLogClient initialLogs={logs} />
    </div>
  );
}
