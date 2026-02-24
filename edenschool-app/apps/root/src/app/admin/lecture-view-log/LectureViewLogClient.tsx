'use client';

import { useState } from 'react';

interface Log {
  id: number;
  userId: number;
  lectureId: number;
  ip: string;
  deviceType: string;
  startTime?: string;
  endTime?: string;
  startSeconds: number;
  endSeconds?: number;
  duration?: number;
  studentName?: string;
  school?: string;
  grade?: string;
  lectureSubject?: string;
}

function formatSeconds(sec?: number | null): string {
  if (sec == null) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDuration(sec?: number | null): string {
  if (sec == null) return '-';
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${m}분`;
  return `${m}분 ${s}초`;
}

function deviceLabel(type: string): string {
  switch (type) {
    case 'pc': return 'PC';
    case 'mobile': return '모바일';
    case 'tablet': return '태블릿';
    default: return '기타';
  }
}

export default function LectureViewLogClient({ initialLogs }: { initialLogs: Log[] }) {
  const [logs, setLogs] = useState<Log[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateSearch = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lecture/view-log?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      alert('조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setStartDate('');
    setEndDate('');
    setSearch('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/lecture/view-log');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      alert('조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const keyword = search.toLowerCase();
    return (
      (log.studentName && log.studentName.toLowerCase().includes(keyword)) ||
      (log.school && log.school.toLowerCase().includes(keyword)) ||
      (log.lectureSubject && log.lectureSubject.toLowerCase().includes(keyword)) ||
      (log.ip && log.ip.includes(keyword))
    );
  });

  return (
    <>
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-end">
        <div>
          <label className="form-label mb-1" style={{ fontSize: '0.85rem' }}>시작일</label>
          <input type="date" className="form-control form-control-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="form-label mb-1" style={{ fontSize: '0.85rem' }}>종료일</label>
          <input type="date" className="form-control form-control-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn btn-sm btn-primary" onClick={handleDateSearch} disabled={loading || !startDate || !endDate}>
          {loading ? '조회중...' : '날짜 검색'}
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={handleReset} disabled={loading}>
          초기화
        </button>
        <div className="ms-auto" style={{ minWidth: 220 }}>
          <input
            className="form-control form-control-sm"
            type="text"
            placeholder="이름, 학교, 강의명, IP 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-striped" style={{ fontSize: '0.88rem' }}>
          <thead className="table-primary">
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>이름</th>
              <th>학교</th>
              <th>학년</th>
              <th>강의명</th>
              <th>시작시간</th>
              <th>종료시간</th>
              <th>시청시간</th>
              <th>영상구간</th>
              <th>기기</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-muted py-4">기록이 없습니다.</td>
              </tr>
            ) : (
              filtered.map((log, i) => (
                <tr key={log.id}>
                  <td className="text-center">{filtered.length - i}</td>
                  <td>{log.studentName}</td>
                  <td>{log.school}</td>
                  <td>{log.grade}</td>
                  <td>{log.lectureSubject || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{log.startTime || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{log.endTime || '-'}</td>
                  <td>{formatDuration(log.duration)}</td>
                  <td>{formatSeconds(log.startSeconds)} ~ {formatSeconds(log.endSeconds)}</td>
                  <td>{deviceLabel(log.deviceType)}</td>
                  <td style={{ fontSize: '0.82rem' }}>{log.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
