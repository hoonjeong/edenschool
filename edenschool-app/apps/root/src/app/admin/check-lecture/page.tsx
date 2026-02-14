import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-session';
import { selectStudentById } from '@edenschool/common/queries/student';
import { selectLectureListByStudentIdAdmin } from '@edenschool/common/queries/lecture';

export default async function CheckLecturePage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string }>;
}) {
  const session = await requireAdminSession();

  const { sid } = await searchParams;
  if (!sid) {
    return (
      <div>
        <div className="alert alert-danger">학생 ID가 필요합니다.</div>
      </div>
    );
  }

  const studentId = Number(sid);

  // Fetch student info
  const student = await selectStudentById(studentId);
  if (!student) {
    return (
      <div>
        <div className="alert alert-danger">학생을 찾을 수 없습니다.</div>
      </div>
    );
  }

  // Fetch lectures for student's classes
  const rawLectures = await selectLectureListByStudentIdAdmin(studentId);
  const lectures = rawLectures.map((l) => ({
    id: l.id,
    subject: l.subject,
    className: l.className || '',
    teacher: l.teacher,
    date: l.lectureDate,
    code: l.code,
  }));

  return (
    <div>
      <h4 className="mb-3">
        학생 강의 확인 - {student.name} ({student.school} {student.grade}
        {student.year})
      </h4>

      <div className="mb-3">
        <Link href="/admin/lecture-info" className="btn btn-secondary btn-sm">
          강의 목록
        </Link>
      </div>

      <table className="table table-bordered table-hover">
        <thead className="thead-light">
          <tr>
            <th>ID</th>
            <th>제목</th>
            <th>반이름</th>
            <th>선생님</th>
            <th>날짜</th>
            <th>코드</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {lectures.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center">
                강의가 없습니다.
              </td>
            </tr>
          ) : (
            lectures.map((lec) => (
              <tr key={lec.id}>
                <td>{lec.id}</td>
                <td>{lec.subject}</td>
                <td>{lec.className}</td>
                <td>{lec.teacher}</td>
                <td>{lec.date}</td>
                <td>{lec.code}</td>
                <td>
                  <Link
                    href={`/admin/lecture-view?id=${lec.id}`}
                    className="btn btn-sm btn-info mr-1"
                  >
                    보기
                  </Link>
                  <Link
                    href={`/admin/lecture-modify?id=${lec.id}`}
                    className="btn btn-sm btn-warning"
                  >
                    수정
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="text-muted">총 {lectures.length}건</p>
    </div>
  );
}
