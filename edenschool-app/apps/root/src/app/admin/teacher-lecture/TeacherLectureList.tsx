'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Lecture {
  id: number;
  subject: string;
  teacher: string;
  lectureDate: string;
}

interface ProgressStudent {
  userId: number;
  studentName: string;
  school: string;
  grade: string;
  watchedSeconds: number;
  duration: number;
  percent: number;
  completed: number;
  updatedAt: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}분 ${s}초`;
}

export default function TeacherLectureList({ lectures }: { lectures: Lecture[] }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [progressList, setProgressList] = useState<ProgressStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = lectures.filter((l) => {
    if (!search) return true;
    const keyword = search.toLowerCase();
    return (
      l.subject.toLowerCase().includes(keyword) ||
      l.teacher.toLowerCase().includes(keyword) ||
      (l.lectureDate && l.lectureDate.includes(keyword))
    );
  });

  async function handleLectureClick(lectureId: number) {
    if (selectedId === lectureId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(lectureId);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/lecture/progress?lectureId=${lectureId}`);
      const data = await res.json();
      setProgressList(data.list || []);
    } catch {
      setProgressList([]);
    }
    setLoading(false);
  }

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
            <th style={{ minWidth: '74px' }}>시청현황</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center">
                {search ? '검색 결과가 없습니다.' : '강의가 없습니다.'}
              </td>
            </tr>
          ) : (
            filtered.map((l) => (
              <>
                <tr key={l.id}>
                  <td className="text-center">{l.id}</td>
                  <td>
                    <Link href={`/admin/lecture-view?id=${l.id}`}>{l.subject}</Link>
                  </td>
                  <td className="text-center">{l.teacher}</td>
                  <td className="text-center">{l.lectureDate}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleLectureClick(l.id)}
                    >
                      {selectedId === l.id ? '닫기' : '보기'}
                    </button>
                  </td>
                </tr>
                {selectedId === l.id && (
                  <tr key={`progress-${l.id}`}>
                    <td colSpan={5} style={{ padding: 0, background: '#f8fafc' }}>
                      {loading ? (
                        <div className="text-center py-3">로딩중...</div>
                      ) : progressList.length === 0 ? (
                        <div className="text-center py-3 text-muted">시청 기록이 없습니다.</div>
                      ) : (
                        <table className="table table-sm mb-0" style={{ background: '#fff' }}>
                          <thead>
                            <tr>
                              <th>이름</th>
                              <th>학교</th>
                              <th>학년</th>
                              <th>진도율</th>
                              <th>시청 시간</th>
                              <th>완료</th>
                              <th>최근 시청</th>
                            </tr>
                          </thead>
                          <tbody>
                            {progressList.map((p) => (
                              <tr key={p.userId}>
                                <td>{p.studentName}</td>
                                <td>{p.school}</td>
                                <td>{p.grade}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                                      <div style={{ width: `${Math.min(p.percent, 100)}%`, height: '100%', background: p.percent >= 90 ? '#22c55e' : '#3b82f6', borderRadius: 3 }} />
                                    </div>
                                    <span style={{ fontSize: 12, minWidth: 40 }}>{Math.round(p.percent)}%</span>
                                  </div>
                                </td>
                                <td>{formatTime(p.watchedSeconds)}</td>
                                <td>{p.completed ? <span className="badge badge-success">완료</span> : <span className="badge badge-secondary">진행중</span>}</td>
                                <td style={{ fontSize: 12 }}>{p.updatedAt}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
