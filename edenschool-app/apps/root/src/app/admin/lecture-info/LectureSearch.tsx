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

interface Props {
  lectures: LectureRow[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
}

export default function LectureSearch({ lectures, total, page, totalPages, search }: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(search);

  const doSearch = () => {
    const sp = new URLSearchParams();
    if (keyword.trim()) sp.set('search', keyword.trim());
    const qs = sp.toString();
    router.push(`/admin/lecture-info${qs ? '?' + qs : ''}`);
  };

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

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/admin/lecture-info${qs ? '?' + qs : ''}`;
  }

  return (
    <>
      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="검색 (제목, 반이름, 선생님, 날짜) — Enter"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
        />
        <div className="input-group-append">
          <button className="btn btn-primary" type="button" onClick={doSearch}>
            <i className="fas fa-search"></i> 검색
          </button>
        </div>
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
          {lectures.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center">
                {search ? '검색 결과가 없습니다.' : '강의가 없습니다.'}
              </td>
            </tr>
          ) : (
            lectures.map((lec) => (
              <tr key={lec.id}>
                <td className="text-center">{lec.id}</td>
                <td>
                  <Link href={`/admin/lecture-view?id=${lec.id}`}>{lec.subject}</Link>
                </td>
                <td className="text-center">{lec.className}</td>
                <td className="text-center">{lec.teacher}</td>
                <td className="text-center">{lec.date}</td>
                <td className="text-center">{lec.code}</td>
                <td className="text-center">
                  <Link href={`/admin/lecture-modify?id=${lec.id}`} className="btn btn-sm btn-warning mr-1">
                    수정
                  </Link>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(lec.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="d-flex justify-content-between align-items-center">
        <p className="text-muted mb-0">총 {total}건 (페이지 {page}/{totalPages || 1})</p>
        {totalPages > 1 && (
          <nav>
            <ul className="pagination pagination-sm mb-0">
              {page > 1 && (
                <li className="page-item"><Link className="page-link" href={pageUrl(page - 1)}>이전</Link></li>
              )}
              {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                const start = totalPages <= 10 ? 1 : Math.max(1, Math.min(page - 4, totalPages - 9));
                const p = start + i;
                return (
                  <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <Link className="page-link" href={pageUrl(p)}>{p}</Link>
                  </li>
                );
              })}
              {page < totalPages && (
                <li className="page-item"><Link className="page-link" href={pageUrl(page + 1)}>다음</Link></li>
              )}
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}
