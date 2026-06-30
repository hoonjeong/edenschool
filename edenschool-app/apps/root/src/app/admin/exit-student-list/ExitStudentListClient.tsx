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
  modifyDate?: string;
}

export default function ExitStudentListClient({ students }: { students: Student[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  const kw = q.trim().toLowerCase();
  const filtered = kw
    ? students.filter((s) =>
        [s.name, s.school, s.sphone, s.pphone].some((v) => (v || '').toLowerCase().includes(kw))
      )
    : students;

  const rejoin = async (id: number, name: string) => {
    if (!confirm(`${name} 학생을 재등록 처리하시겠습니까?`)) return;
    setBusy(id);
    try {
      const res = await fetch('/api/admin/student/rejoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        alert('재등록되었습니다.');
        router.refresh();
      } else {
        alert('재등록에 실패했습니다.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h4 className="mb-3">퇴원생 관리 (퇴원 {students.length}명)</h4>

      <input
        type="text"
        className="form-control mb-3"
        style={{ maxWidth: 320 }}
        placeholder="이름·학교·연락처 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <table className="table table-bordered table-hover">
        <thead className="thead-light">
          <tr>
            <th>이름</th>
            <th>학교</th>
            <th>학년</th>
            <th>학생연락처</th>
            <th>학부모연락처</th>
            <th>퇴원일</th>
            <th style={{ width: 110 }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center">퇴원생이 없습니다.</td>
            </tr>
          ) : (
            filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link href={`/admin/student-info?id=${s.id}`}>{s.name}</Link>
                </td>
                <td>{s.school}</td>
                <td>{s.grade}{s.year}</td>
                <td>{s.sphone}</td>
                <td>{s.pphone}</td>
                <td>{s.modifyDate || '-'}</td>
                <td>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => rejoin(s.id, s.name)}
                    disabled={busy === s.id}
                  >
                    {busy === s.id ? '처리 중...' : '재등록'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
