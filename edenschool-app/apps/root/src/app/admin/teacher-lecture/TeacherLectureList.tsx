'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Lecture {
  id: number;
  subject: string;
  teacher: string;
  lectureDate: string;
}

export default function TeacherLectureList({ lectures }: { lectures: Lecture[] }) {
  const [search, setSearch] = useState('');

  const filtered = lectures.filter((l) => {
    if (!search) return true;
    const keyword = search.toLowerCase();
    return (
      l.subject.toLowerCase().includes(keyword) ||
      l.teacher.toLowerCase().includes(keyword) ||
      (l.lectureDate && l.lectureDate.includes(keyword))
    );
  });

  return (
    <>
      <input
        className="form-control mb-3"
        type="text"
        placeholder="검색어를 입력해주세요"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table className="table table-bordered table-striped">
        <thead className="table-primary">
          <tr>
            <th style={{ minWidth: '58px' }}>번호</th>
            <th>제목</th>
            <th style={{ minWidth: '74px' }}>담당</th>
            <th style={{ minWidth: '58px' }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center">
                {search ? '검색 결과가 없습니다.' : '강의가 없습니다.'}
              </td>
            </tr>
          ) : (
            filtered.map((l) => (
              <tr key={l.id}>
                <td className="text-center">{l.id}</td>
                <td>
                  <Link href={`/admin/lecture-view?id=${l.id}`}>{l.subject}</Link>
                </td>
                <td className="text-center">{l.teacher}</td>
                <td className="text-center">{l.lectureDate}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
