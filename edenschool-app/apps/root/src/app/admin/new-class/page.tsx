'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

const SUBJECTS = ['국어', '수학', '논술'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8~22
const MINUTES = [0, 10, 20, 30, 40, 50];
const PRICES = [
  250000, 270000, 280000, 290000, 300000, 320000, 330000, 350000,
  370000, 380000, 400000, 420000, 430000, 450000, 470000, 480000, 500000,
];

function NewClassForm() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [subject] = useState('국어');
  const [grade, setGrade] = useState('중');
  const [year, setYear] = useState('1');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [hour, setHour] = useState(15);
  const [minute, setMinute] = useState(0);
  const [teacherOne, setTeacherOne] = useState('');
  const [teacherTwo, setTeacherTwo] = useState('');
  const [code] = useState('D');
  const [price] = useState(300000);

  useEffect(() => {
    fetch('/api/admin/class/teachers')
      .then(res => res.json())
      .then(data => {
        setTeachers(data.teachers || []);
        if (data.teachers && data.teachers.length > 0) {
          setTeacherOne(data.teachers[0].name);
          setTeacherTwo(data.teachers[0].name);
        }
      })
      .catch(() => {});
  }, []);

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('반이름을 입력해주세요.');
      return;
    }
    if (selectedDays.length === 0) {
      setError('요일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    const day = selectedDays.join('');

    try {
      const res = await fetch('/api/admin/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subject,
          grade,
          year,
          day,
          hour,
          minute,
          teacherOne,
          teacherTwo,
          code,
          price,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('수강반이 추가되었습니다.');
        router.push('/admin/class-manager');
      } else {
        setError(data.error || '수강반 추가에 실패했습니다.');
      }
    } catch {
      setError('수강반 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '720px' }}>
          <h4>수강반 추가</h4>
          <hr />
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>반이름</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="반이름을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label>학년</label>
              <div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="grade"
                    id="grade-mid"
                    value="중"
                    checked={grade === '중'}
                    onChange={e => setGrade(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="grade-mid">중</label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="grade"
                    id="grade-high"
                    value="고"
                    checked={grade === '고'}
                    onChange={e => setGrade(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="grade-high">고</label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>학년</label>
              <div>
                {['1', '2', '3'].map(y => (
                  <div className="form-check form-check-inline" key={y}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="year"
                      id={`year-${y}`}
                      value={y}
                      checked={year === y}
                      onChange={e => setYear(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor={`year-${y}`}>{y}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>요일</label>
              <div>
                {DAYS.map(d => (
                  <div className="form-check form-check-inline" key={d}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`day-${d}`}
                      checked={selectedDays.includes(d)}
                      onChange={() => handleDayToggle(d)}
                    />
                    <label className="form-check-label" htmlFor={`day-${d}`}>{d}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>시간</label>
              <div className="form-row">
                <div className="col-auto">
                  <select className="form-control" value={hour} onChange={e => setHour(Number(e.target.value))}>
                    {HOURS.map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}시</option>
                    ))}
                  </select>
                </div>
                <div className="col-auto">
                  <select className="form-control" value={minute} onChange={e => setMinute(Number(e.target.value))}>
                    {MINUTES.map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}분</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>1교시 선생님</label>
              <select className="form-control" value={teacherOne} onChange={e => setTeacherOne(e.target.value)}>
                {teachers.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>2교시 선생님</label>
              <select className="form-control" value={teacherTwo} onChange={e => setTeacherTwo(e.target.value)}>
                {teachers.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '추가 중...' : '수강반 추가'}
              </button>
              <a href="/admin/class-manager" className="btn btn-secondary ml-2">취소</a>
            </div>
          </form>
    </div>
  );
}

export default function NewClassPage() {
  return (
    <Suspense fallback={
      <div>
        <p>로딩 중...</p>
      </div>
    }>
      <NewClassForm />
    </Suspense>
  );
}
