'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LectureRow {
  id: number;
  subject: string;
  className: string;
  teacher: string;
  date: string;
  code: string;
}

export default function LectureSearch({ lectures }: { lectures: LectureRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleDelete = async (id: number) => {
    if (!confirm('이 강의를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch('/api/admin/lecture/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('삭제되었습니다.');
        router.refresh();
      } else {
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const filtered = lectures.filter((lec) => {
    const keyword = search.toLowerCase();
    return (
      lec.subject.toLowerCase().includes(keyword) ||
      lec.className.toLowerCase().includes(keyword) ||
      lec.teacher.toLowerCase().includes(keyword) ||
      lec.date.includes(keyword) ||
      (lec.code && lec.code.toLowerCase().includes(keyword))
    );
  });

  return (
    <>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="검색 (제목, 반이름, 선생님, 날짜, 코드)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="table table-bordered table-hover">
        <thead className="thead-light">
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>반</th>
            <th>담당</th>
            <th>날짜</th>
            <th>구분</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center">
                강의가 없습니다.
              </td>
            </tr>
          ) : (
            filtered.map((lec) => (
              <tr key={lec.id}>
                <td className="text-center">{lec.id}</td>
                <td>
                  <Link href={`/admin/lecture-view?id=${lec.id}`}>
                    {lec.subject}
                  </Link>
                </td>
                <td className="text-center">{lec.className}</td>
                <td className="text-center">{lec.teacher}</td>
                <td className="text-center">{lec.date}</td>
                <td className="text-center">{lec.code}</td>
                <td className="text-center">
                  <Link
                    href={`/admin/lecture-modify?id=${lec.id}`}
                    className="btn btn-sm btn-warning mr-1"
                  >
                    수정
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(lec.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="text-muted">
        총 {filtered.length}건
        {search && ` (전체 ${lectures.length}건 중)`}
      </p>
    </>
  );
}
