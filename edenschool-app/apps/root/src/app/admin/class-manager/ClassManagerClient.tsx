'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface ClassRow {
  id: number;
  name: string;
  grade: string;
  year: number | string;
  day: string;
  hour: number;
  minute: number;
  teacherOne: string;
  teacherTwo: string;
  liveCount: number;
  liveStatus: number;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ClassManagerClient({ classList }: { classList: ClassRow[] }) {
  const [keyword, setKeyword] = useState('');
  const [teacher, setTeacher] = useState('');
  const [gradeYear, setGradeYear] = useState('');
  const [day, setDay] = useState('');
  const [status, setStatus] = useState('ALL'); // 기본은 기존 화면과 동일하게 전체

  // 드롭다운 후보는 실제 데이터에서 뽑는다
  const teacherOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of classList) {
      if (c.teacherOne) set.add(c.teacherOne);
      if (c.teacherTwo) set.add(c.teacherTwo);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [classList]);

  const gradeYearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of classList) set.add(`${c.grade}${c.year}`);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [classList]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return classList.filter((c) => {
      if (status === 'LIVE' && c.liveStatus !== 1) return false;
      if (status === 'END' && c.liveStatus === 1) return false;
      if (teacher && c.teacherOne !== teacher && c.teacherTwo !== teacher) return false;
      if (gradeYear && `${c.grade}${c.year}` !== gradeYear) return false;
      if (day && !(c.day || '').includes(day)) return false;
      if (kw) {
        const haystack = [c.name, c.teacherOne, c.teacherTwo, c.day, `${c.grade}${c.year}`]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [classList, keyword, teacher, gradeYear, day, status]);

  const totalStudents = filtered.reduce((sum, c) => sum + (c.liveCount || 0), 0);
  const isFiltered = Boolean(keyword || teacher || gradeYear || day) || status !== 'ALL';

  const reset = () => {
    setKeyword('');
    setTeacher('');
    setGradeYear('');
    setDay('');
    setStatus('ALL');
  };

  return (
    <div>
      <h4>수강반 관리</h4>
      <hr />

      <div className="mb-3">
        <Link href="/admin/new-class" className="btn btn-primary btn-sm">수강반 추가</Link>
      </div>

      {/* ── 조회 필터 ── */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="form-row align-items-center">
            <div className="col-md-3 mb-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="반이름·선생님 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="col-md-2 mb-2">
              <select
                className="form-control form-control-sm"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
              >
                <option value="">선생님 전체</option>
                {teacherOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 mb-2">
              <select
                className="form-control form-control-sm"
                value={gradeYear}
                onChange={(e) => setGradeYear(e.target.value)}
              >
                <option value="">학년 전체</option>
                {gradeYearOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 mb-2">
              <select
                className="form-control form-control-sm"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                <option value="">요일 전체</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}요일</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 mb-2">
              <select
                className="form-control form-control-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">상태 전체</option>
                <option value="LIVE">진행</option>
                <option value="END">종강</option>
              </select>
            </div>
            <div className="col-md-1 mb-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm btn-block"
                onClick={reset}
                disabled={!isFiltered}
              >
                초기화
              </button>
            </div>
          </div>

          {/* 선생님 빠른 선택 */}
          {teacherOptions.length > 0 && (
            <div className="mt-1">
              {teacherOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-sm mr-1 mb-1 ${teacher === t ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => setTeacher(teacher === t ? '' : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover table-sm">
          <thead className="thead-dark">
            <tr>
              <th>반이름</th>
              <th>학년</th>
              <th>요일</th>
              <th>시간</th>
              <th>1교시선생</th>
              <th>2교시선생</th>
              <th>수강인원</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className={c.liveStatus === 0 ? 'table-secondary' : ''}>
                <td>{c.name}</td>
                <td>{c.grade}{c.year}</td>
                <td>{c.day}</td>
                <td>{String(c.hour).padStart(2, '0')}:{String(c.minute).padStart(2, '0')}</td>
                <td>{c.teacherOne}</td>
                <td>{c.teacherTwo}</td>
                <td>{c.liveCount}명</td>
                <td>
                  {c.liveStatus === 1 ? (
                    <span className="badge badge-success">진행</span>
                  ) : (
                    <span className="badge badge-secondary">종강</span>
                  )}
                </td>
                <td>
                  <Link href={`/admin/class-info?id=${c.id}`} className="btn btn-info btn-sm mr-1">보기</Link>
                  {c.liveStatus === 1 ? (
                    <form action="/api/admin/class/end" method="post" style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="btn btn-warning btn-sm mr-1">종강</button>
                    </form>
                  ) : (
                    <form action="/api/admin/class/restart" method="post" style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="btn btn-success btn-sm mr-1">재개</button>
                    </form>
                  )}
                  <form action="/api/admin/class/delete" method="post" style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="btn btn-danger btn-sm">삭제</button>
                  </form>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-muted py-3">
                  {classList.length === 0 ? '등록된 수강반이 없습니다.' : '조건에 맞는 수강반이 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-muted">
        {filtered.length}개 수강반 · 수강인원 {totalStudents}명
        {filtered.length !== classList.length && ` (전체 ${classList.length}개 중)`}
      </p>
    </div>
  );
}
