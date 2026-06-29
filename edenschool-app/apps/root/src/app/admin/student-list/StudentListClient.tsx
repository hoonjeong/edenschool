'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Student {
  id: number;
  name: string;
  school: string;
  grade: string;
  year: number;
  sphone: string;
  pphone: string;
  status?: number;
}

export default function StudentListClient({ students }: { students: Student[] }) {
  const [q, setQ] = useState('');
  const kw = q.trim().toLowerCase();
  const filtered = kw
    ? students.filter((s) =>
        [s.name, s.school, s.sphone, s.pphone].some((v) => (v || '').toLowerCase().includes(kw))
      )
    : students;

  return (
    <div>
      <h4 className="mb-3">학생 관리 (재원 {students.length}명)</h4>

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
            <th style={{ width: 110 }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center">학생이 없습니다.</td>
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
                <td>
                  <Link href={`/admin/student-info?id=${s.id}`} className="btn btn-sm btn-primary">
                    상세/관리
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
