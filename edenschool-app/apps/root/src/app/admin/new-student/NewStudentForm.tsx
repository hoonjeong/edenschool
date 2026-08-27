'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
  id: number;
  name: string;
  school: string;
  grade: string;
  year: number;
  sphone: string;
  pphone: string;
  status: number;
  date?: string;
}

type Payload = Record<string, string>;

function label(m: Match) {
  const school = [m.school, m.grade && m.year ? `${m.grade}${m.year}` : ''].filter(Boolean).join(' ');
  return school ? `${m.name} (${school})` : m.name;
}

export function NewStudentForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState<Payload | null>(null);
  const [exited, setExited] = useState<Match[]>([]);
  const [active, setActive] = useState<Match[]>([]);

  function reset() {
    setError('');
    setExited([]);
    setActive([]);
  }

  // force=true 는 확인 화면에서 "신규로 등록"을 고른 경우(동명이인 등).
  async function create(data: Payload, force: boolean) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, force }),
      });
      if (res.ok) {
        const { id } = await res.json();
        router.push(`/admin/student-info?id=${id}`);
        return;
      }
      if (res.status === 403) {
        setError('권한이 없습니다. 원장 계정으로 로그인해주세요.');
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 && body.code === 'active') {
        setActive(body.students || []);
        return;
      }
      if (res.status === 409 && body.code === 'exited') {
        setExited(body.students || []);
        return;
      }
      setError(body.error || '등록 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function rejoin(id: number) {
    if (!payload) return;
    setBusy(true);
    try {
      // 입력한 학교·학년·연락처·메모로 기존 행을 갱신하면서 재원 처리한다.
      const res = await fetch('/api/admin/student/rejoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, student: payload }),
      });
      if (!res.ok) {
        setError('재원 처리 중 오류가 발생했습니다.');
        return;
      }
      router.push(`/admin/student-info?id=${id}`);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Payload;
    setPayload(data);
    create(data, false);
  }

  const asking = exited.length > 0 || active.length > 0;

  return (
    <div>
      <h4 className="mb-3">신규 학생 등록</h4>

      {error && <div className="alert alert-danger">{error}</div>}

      {active.length > 0 && (
        <div className="alert alert-danger">
          <strong>이미 재원 중인 학생입니다.</strong> 중복 등록되지 않도록 기존 학생 정보를 확인해주세요.
          <ul className="mb-2 mt-2">
            {active.map((m) => (
              <li key={m.id}>
                {label(m)} · 학생 {m.sphone || '-'} · 학부모 {m.pphone || '-'}{' '}
                <a href={`/admin/student-info?id=${m.id}`}>학생 정보 보기</a>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-sm btn-secondary" onClick={reset}>
            닫기
          </button>
        </div>
      )}

      {exited.length > 0 && (
        <div className="alert alert-warning">
          <strong>퇴원생 정보에 있습니다. 재원 처리할까요?</strong>
          <div className="mt-1" style={{ fontSize: '0.9rem' }}>
            재원 처리를 하면 새로 만들지 않고 기존 학생을 되살리며, 방금 입력한 학교·학년·연락처·메모로 갱신합니다.
          </div>
          <ul className="mt-2 mb-2">
            {exited.map((m) => (
              <li key={m.id} className="mb-1">
                {label(m)} · 학생 {m.sphone || '-'} · 학부모 {m.pphone || '-'}
                {m.date ? ` · 퇴원 ${m.date}` : ''}{' '}
                <a href={`/admin/student-info?id=${m.id}`} target="_blank" rel="noopener noreferrer">
                  정보 보기
                </a>{' '}
                <button
                  type="button"
                  className="btn btn-sm btn-primary ml-1"
                  disabled={busy}
                  onClick={() => rejoin(m.id)}
                >
                  재원 처리
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={busy}
            onClick={() => payload && create(payload, true)}
          >
            신규로 등록 (동명이인)
          </button>{' '}
          <button type="button" className="btn btn-sm btn-secondary" disabled={busy} onClick={reset}>
            취소
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">이름</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="name" required />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학교</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="school" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학급</label>
          <div className="col-sm-10">
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="grade" id="gradeMiddle" value="중" />
              <label className="form-check-label" htmlFor="gradeMiddle">중</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="grade" id="gradeHigh" value="고" defaultChecked />
              <label className="form-check-label" htmlFor="gradeHigh">고</label>
            </div>
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학년</label>
          <div className="col-sm-10">
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="year" id="year1" value="1" defaultChecked />
              <label className="form-check-label" htmlFor="year1">1</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="year" id="year2" value="2" />
              <label className="form-check-label" htmlFor="year2">2</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="year" id="year3" value="3" />
              <label className="form-check-label" htmlFor="year3">3</label>
            </div>
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학생 연락처</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="sphone" placeholder="010-0000-0000" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">학부모 연락처</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="pphone" placeholder="010-0000-0000" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">주소</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="address" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">특이사항</label>
          <div className="col-sm-10">
            <input type="text" className="form-control" name="specialty" />
          </div>
        </div>

        <div className="form-group row mb-2">
          <label className="col-sm-2 col-form-label">메모</label>
          <div className="col-sm-10">
            <textarea className="form-control" name="memo" rows={3} />
          </div>
        </div>

        <div className="form-group row mb-2">
          <div className="col-sm-10 offset-sm-2">
            <button type="submit" className="btn btn-primary" disabled={busy || asking}>
              {busy ? '처리 중...' : '회원가입'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
