'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Student {
  id: number;
  name: string;
  school: string;
  grade: string;
  year: number;
  sphone: string;
  pphone: string;
  address: string;
  specialty: string;
  memo: string;
  status?: number;
}

interface ClassStatus {
  id: number;
  studentId: number;
  status: number;
  className?: string;
  startTime?: string;
  endTime?: string;
}

interface Props {
  student: Student;
  classList: ClassStatus[];
  classNames: string[];
}

export default function StudentInfoClient({ student, classList, classNames }: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [className, setClassName] = useState('');

  const setClass = async () => {
    if (!className) {
      alert('반 이름을 입력하세요.');
      return;
    }
    if (!startDate) {
      alert('시작일을 입력하세요.');
      return;
    }

    const res = await fetch('/api/admin/class/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_name: className,
        student_id: student.id,
        start_date: startDate,
      }),
    });

    if (res.ok) {
      alert('반 등록이 완료되었습니다.');
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.message || '반 등록에 실패했습니다.');
    }
  };

  const setStop = async (id: number) => {
    if (!confirm('수강을 종료하시겠습니까?')) return;

    const res = await fetch('/api/admin/class/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'END' }),
    });

    if (res.ok) {
      alert('수강이 종료되었습니다.');
      router.refresh();
    } else {
      alert('처리에 실패했습니다.');
    }
  };

  const setCancel = async (id: number) => {
    if (!confirm('수강 종료를 취소하시겠습니까?')) return;

    const res = await fetch('/api/admin/class/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'RE' }),
    });

    if (res.ok) {
      alert('수강이 재개되었습니다.');
      router.refresh();
    } else {
      alert('처리에 실패했습니다.');
    }
  };

  const deleteClass = async (id: number) => {
    if (!confirm('수강 기록을 삭제하시겠습니까?')) return;

    const res = await fetch(`/api/admin/class/status/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      alert('삭제되었습니다.');
      router.refresh();
    } else {
      alert('삭제에 실패했습니다.');
    }
  };

  const deleteStudent = async () => {
    if (!confirm('학생을 퇴원 처리하시겠습니까?')) return;

    const res = await fetch('/api/admin/student/exit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id }),
    });

    if (res.ok) {
      alert('퇴원 처리되었습니다.');
      router.push('/admin/student-manage');
    } else {
      alert('처리에 실패했습니다.');
    }
  };

  const statusLabel = (status: number) => {
    switch (status) {
      case 1:
        return <span className="badge badge-success">수강중</span>;
      case 0:
        return <span className="badge badge-secondary">종료</span>;
      default:
        return <span className="badge badge-warning">{status}</span>;
    }
  };

  return (
    <div className="row">
      {/* Left column: Student info */}
      <div className="col-md-5">
        <h5 className="mb-3">학생 정보</h5>
        <table className="table table-bordered">
          <tbody>
            <tr>
              <th className="bg-light" style={{ width: '30%' }}>이름</th>
              <td>{student.name}</td>
            </tr>
            <tr>
              <th className="bg-light">학교/학년</th>
              <td>{student.school} {student.grade}{student.year}</td>
            </tr>
            <tr>
              <th className="bg-light">학생 연락처</th>
              <td>{student.sphone}</td>
            </tr>
            <tr>
              <th className="bg-light">학부모 연락처</th>
              <td>{student.pphone}</td>
            </tr>
            <tr>
              <th className="bg-light">주소</th>
              <td>{student.address}</td>
            </tr>
            <tr>
              <th className="bg-light">특이사항</th>
              <td>{student.specialty}</td>
            </tr>
            <tr>
              <th className="bg-light">메모</th>
              <td>{student.memo}</td>
            </tr>
          </tbody>
        </table>
        <div className="d-flex gap-2">
          <Link href={`/admin/modify-student?id=${student.id}`} className="btn btn-warning mr-2">
            수정
          </Link>
          <button className="btn btn-danger" onClick={deleteStudent}>
            퇴원
          </button>
        </div>
      </div>

      {/* Right column: Class enrollment */}
      <div className="col-md-7">
        <h5 className="mb-3">반 등록</h5>

        {/* Enrollment form */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="form-row align-items-end">
              <div className="col-md-3 mb-2">
                <label>시작일</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-5 mb-2">
                <label>반 이름</label>
                <input
                  type="text"
                  className="form-control"
                  list="classNameList"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="반 이름 입력"
                />
                <datalist id="classNameList">
                  {classNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="col-md-4 mb-2">
                <button className="btn btn-primary" onClick={setClass}>
                  반 등록
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Class list */}
        <h5 className="mb-3">
          수강 이력 (<Link href={`/admin/check-lecture?sid=${student.id}`}>동영상 확인</Link>)
        </h5>
        <table className="table table-bordered table-hover">
          <thead className="thead-light">
            <tr>
              <th>반 이름</th>
              <th>시작일</th>
              <th>종료일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {classList.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">수강 이력이 없습니다.</td>
              </tr>
            ) : (
              classList.map((cls) => (
                <tr key={cls.id}>
                  <td>{cls.className}</td>
                  <td>{cls.startTime}</td>
                  <td>{cls.endTime || '-'}</td>
                  <td>{statusLabel(cls.status)}</td>
                  <td>
                    {cls.status === 1 ? (
                      <button
                        className="btn btn-sm btn-warning mr-1"
                        onClick={() => setStop(cls.id)}
                      >
                        종료
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-success mr-1"
                        onClick={() => setCancel(cls.id)}
                      >
                        재개
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteClass(cls.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
