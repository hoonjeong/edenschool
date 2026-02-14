import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-session';
import {
  selectTeacherClassListByTeacherName,
  selectMonthlyNewStudentsByTeacher,
  selectMonthlyExitStudentsByTeacher,
} from '@edenschool/common/queries/class';

export default async function StudentManagePage() {
  const session = await requireAdminSession();

  const teacherName = session.user.name;

  const [classList, newStudents, exitStudents] = await Promise.all([
    selectTeacherClassListByTeacherName(teacherName),
    selectMonthlyNewStudentsByTeacher(teacherName),
    selectMonthlyExitStudentsByTeacher(teacherName),
  ]);

  const now = new Date();
  const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  return (
    <div>
      <div className="admin-sub-nav">
        <Link href="/admin/student-manage" className="active">담당반 정보</Link>
        <Link href="/admin/teacher-sms">문자발송</Link>
      </div>

          <h4 className="mb-3">담당반 관리</h4>
          <table className="table table-bordered table-hover">
            <thead className="thead-light">
              <tr>
                <th>반이름</th>
                <th>담당</th>
                <th>인원수</th>
                <th>명단확인</th>
              </tr>
            </thead>
            <tbody>
              {classList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center">담당반이 없습니다.</td>
                </tr>
              ) : (
                classList.map((cls) => (
                  <tr key={cls.id}>
                    <td>{cls.name}</td>
                    <td>
                      {cls.teacherOne}
                      {cls.teacherOne !== cls.teacherTwo && cls.teacherTwo ? ` / ${cls.teacherTwo}` : ''}
                    </td>
                    <td>{cls.liveCount}명</td>
                    <td>
                      <Link
                        href={`/admin/teacher-student-list?id=${cls.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        명단확인
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 이번달 신입생 / 퇴원생 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
            {/* 신입생 */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{monthLabel} 신입생</span>
                <span className="badge badge-primary" style={{ fontSize: '12px' }}>{newStudents.length}명</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {newStudents.length > 0 ? (
                  <table className="table table-sm" style={{ marginBottom: 0, fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>이름</th>
                        <th style={{ padding: '6px 10px' }}>반</th>
                        <th style={{ padding: '6px 10px' }}>등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newStudents.map((s, i) => (
                        <tr key={i}>
                          <td style={{ padding: '4px 10px' }}>{s.studentName}</td>
                          <td style={{ padding: '4px 10px' }}>{s.className}</td>
                          <td style={{ padding: '4px 10px', color: '#64748b' }}>{s.startDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    이번달 신입생이 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* 퇴원생 */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{monthLabel} 퇴원생</span>
                <span className="badge badge-danger" style={{ fontSize: '12px' }}>{exitStudents.length}명</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {exitStudents.length > 0 ? (
                  <table className="table table-sm" style={{ marginBottom: 0, fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>이름</th>
                        <th style={{ padding: '6px 10px' }}>반</th>
                        <th style={{ padding: '6px 10px' }}>퇴원일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exitStudents.map((s, i) => (
                        <tr key={i}>
                          <td style={{ padding: '4px 10px' }}>{s.studentName}</td>
                          <td style={{ padding: '4px 10px' }}>{s.className}</td>
                          <td style={{ padding: '4px 10px', color: '#dc2626' }}>{s.endDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    이번달 퇴원생이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
    </div>
  );
}
