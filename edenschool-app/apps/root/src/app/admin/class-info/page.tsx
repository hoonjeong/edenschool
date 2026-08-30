import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/admin-session';
import { selectClassInfoById } from '@edenschool/common/queries/class';
import { selectClassStudentListByClassId } from '@edenschool/common/queries/student';
import Link from 'next/link';
import { AttendanceExcelButton } from '@/components/AttendanceExcelButton';
import { toId } from '@/lib/params';

interface ClassInfoPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ClassInfoPage({ searchParams }: ClassInfoPageProps) {
  const session = await requireAdminSession();

  const params = await searchParams;
  const classId = toId(params.id);
  if (!classId) redirect('/admin/class-manager');

  // Fetch class info
  const classInfo = await selectClassInfoById(classId);

  if (!classInfo) {
    return (
      <div>
        <div className="alert alert-danger">수강반 정보를 찾을 수 없습니다.</div>
        <Link href="/admin/class-manager" className="btn btn-secondary">수강반 목록으로</Link>
      </div>
    );
  }

  // Fetch student list for this class
  const students = await selectClassStudentListByClassId(Number(classId));

  return (
    <div>
          <h4>수강반 정보</h4>
          <hr />

          {/* Class Info Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">{classInfo.name}</h5>
            </div>
            <div className="card-body">
              <table className="table table-bordered table-sm mb-0">
                <tbody>
                  <tr>
                    <th style={{ width: '120px' }} className="table-active">과목</th>
                    <td>{classInfo.subject}</td>
                    <th style={{ width: '120px' }} className="table-active">학년</th>
                    <td>{classInfo.grade}{classInfo.year}</td>
                  </tr>
                  <tr>
                    <th className="table-active">요일</th>
                    <td>{classInfo.day}</td>
                    <th className="table-active">시간</th>
                    <td>{String(classInfo.hour).padStart(2, '0')}:{String(classInfo.minute).padStart(2, '0')}</td>
                  </tr>
                  <tr>
                    <th className="table-active">1교시 선생</th>
                    <td>{classInfo.teacherOne}</td>
                    <th className="table-active">2교시 선생</th>
                    <td>{classInfo.teacherTwo}</td>
                  </tr>
                  <tr>
                    <th className="table-active">코드</th>
                    <td>{classInfo.code === 'S' ? '학교별' : '정규'}</td>
                    <th className="table-active">수납금액</th>
                    <td>{classInfo.price ? Number(classInfo.price).toLocaleString() + '원' : '-'}</td>
                  </tr>
                  <tr>
                    <th className="table-active">상태</th>
                    <td colSpan={3}>
                      {classInfo.liveStatus === 1 ? (
                        <span className="badge badge-success">진행</span>
                      ) : (
                        <span className="badge badge-secondary">종강</span>
                      )}
                      {classInfo.liveStatus === 1 ? (
                        <form action="/api/admin/class/end" method="post" style={{ display: 'inline' }} className="ml-2">
                          <input type="hidden" name="id" value={classInfo.id} />
                          <button type="submit" className="btn btn-warning btn-sm">종강처리</button>
                        </form>
                      ) : (
                        <form action="/api/admin/class/restart" method="post" style={{ display: 'inline' }} className="ml-2">
                          <input type="hidden" name="id" value={classInfo.id} />
                          <button type="submit" className="btn btn-success btn-sm">재개</button>
                        </form>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Student List */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">수강생 목록 ({students.length}명)</h5>
              <AttendanceExcelButton classId={classId} />
            </div>
            <div className="card-body p-0">
              <table className="table table-bordered table-hover table-sm mb-0">
                <thead className="thead-light">
                  <tr>
                    <th>#</th>
                    <th>이름</th>
                    <th>학교/학년</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s: any, idx: number) => (
                    <tr key={s.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <Link href={`/admin/student-info?id=${s.id}`}>{s.name}</Link>
                      </td>
                      <td>{s.school} {s.grade}{s.year}</td>
                      <td>
                        <form action="/api/admin/class/end-student" method="post" style={{ display: 'inline' }}>
                          <input type="hidden" name="csId" value={s.classStatusId} />
                          <input type="hidden" name="classId" value={classId} />
                          <button type="submit" className="btn btn-outline-danger btn-sm">종료</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">수강생이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Link href="/admin/class-manager" className="btn btn-secondary">수강반 목록으로</Link>
    </div>
  );
}
