'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminRoleLabel } from '@/lib/admin-roles';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  code: string;
  insertDate: string;
}

export function TeacherManagerClient() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = () => {
    setLoading(true);
    fetch('/api/admin/teacher')
      .then((res) => res.json())
      .then((data) => setTeachers(data.teachers || []))
      .catch(() => alert('선생님 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`${name} 선생님을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/teacher?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTeachers();
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <h4>선생님 관리</h4>
      <hr />
      <div className="mb-3">
        <Link href="/admin/new-teacher" className="btn btn-primary btn-sm">선생님 추가</Link>
      </div>

      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover table-sm">
            <thead className="thead-dark">
              <tr>
                <th>이름</th>
                <th>역할</th>
                <th>이메일</th>
                <th>핸드폰</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">등록된 선생님이 없습니다.</td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{adminRoleLabel(t.code)}</td>
                    <td>{t.email || '-'}</td>
                    <td>{t.phone || '-'}</td>
                    <td className="text-center">{t.insertDate}</td>
                    <td>
                      <Link href={`/admin/teacher-edit?id=${t.id}`} className="btn btn-info btn-sm mr-1">수정</Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(t.id, t.name)}
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
      )}
      <p className="text-muted">총 {teachers.length}명</p>
    </div>
  );
}
