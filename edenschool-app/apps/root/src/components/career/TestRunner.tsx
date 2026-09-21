'use client';

import { useMemo, useState } from 'react';
import { SaveToPortfolio } from './SaveToPortfolio';

/** 서버에서 v1/v2 문항을 같은 모양으로 정규화해 넘긴다. */
export interface RunnerQuestion {
  /** 전송 키 (v1: 배열 순번, v2: no) */
  key: string;
  text: string;
  /** 여러 문항 위에 붙는 지시문 (같은 title 은 한 번만 표시) */
  title?: string;
  /** 골라야 하는 답 개수. 2 이상이면 순위 선택 */
  limit: number;
  choices: { val: string; text: string; input?: boolean }[];
  /** 보기 옆에 붙는 설명 (v1 tip) */
  tips?: string[];
}

export interface RunnerProps {
  qno: string;
  version: 'v1' | 'v2';
  name: string;
  target: string;
  minutes: number;
  questions: RunnerQuestion[];
}

type Answer = { vals: string[]; input?: string };

export function TestRunner({ qno, version, name, target, minutes, questions }: RunnerProps) {
  const [gender, setGender] = useState('');
  const [grade, setGrade] = useState('');
  const [started, setStarted] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showMissing, setShowMissing] = useState(false);

  const answeredCount = useMemo(() => questions.filter((q) => isComplete(q, answers[q.key])).length, [questions, answers]);
  const missing = useMemo(() => questions.filter((q) => !isComplete(q, answers[q.key])), [questions, answers]);

  const pick = (q: RunnerQuestion, val: string) => {
    setAnswers((prev) => {
      const cur = prev[q.key]?.vals ?? [];
      let next: string[];
      if (q.limit <= 1) {
        next = [val];
      } else if (cur.includes(val)) {
        next = cur.filter((v) => v !== val);
      } else if (cur.length >= q.limit) {
        next = [...cur.slice(1), val]; // 가장 먼저 고른 것을 밀어낸다
      } else {
        next = [...cur, val];
      }
      return { ...prev, [q.key]: { ...prev[q.key], vals: next } };
    });
  };

  const setInput = (q: RunnerQuestion, text: string) => {
    setAnswers((prev) => ({ ...prev, [q.key]: { vals: prev[q.key]?.vals ?? [], input: text } }));
  };

  const submit = async () => {
    if (missing.length > 0) {
      setShowMissing(true);
      document.getElementById(`q-${missing[0].key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload =
        version === 'v1'
          ? { qno, gender, grade, startDtm: started, answers: questions.map((q) => `${q.key}=${encodeV1(q, answers[q.key])}`).join(' ') }
          : { qno, gender, grade, startDtm: started, answers: questions.map((q) => ({ no: q.key, val: encodeV2(q, answers[q.key]) })) };
      const res = await fetch('/api/career/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.ok && data.url) {
        setResultUrl(data.url);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error || '결과를 받지 못했습니다.');
      }
    } catch {
      setError('결과 요청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 결과 ── */
  if (resultUrl) {
    return (
      <div className="eden-card">
        <div className="eden-card-header">
          <i className="fas fa-check-circle"></i> 검사 완료
        </div>
        <div className="eden-card-body">
          <p className="career-text">
            {name}({target}) 결과가 준비되었습니다. 아래 버튼을 누르면 커리어넷 결과 페이지가 새 창에서 열립니다.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href={resultUrl} target="_blank" rel="noopener noreferrer" className="eden-btn eden-btn-primary">
              <i className="fas fa-external-link-alt"></i> 결과 보기
            </a>
            <SaveToPortfolio kind="test" refId={qno} title={`${name} (${target})`} content={resultUrl} label="결과 링크를 포트폴리오에 저장" />
          </div>
          <div className="career-note">
            결과 페이지 주소는 이 화면을 닫으면 다시 볼 수 없습니다. 학원생은 포트폴리오에 저장해 두세요. (주소: <span style={{ wordBreak: 'break-all' }}>{resultUrl}</span>)
          </div>
          <div className="career-eden-box career-mt">
            <strong>다음 단계</strong> — 결과에서 확인한 관심 직업을 <a href="/career/job-report">직업별 국어 역량 리포트</a>에서 검색해 보세요. 그 직업에서 국어가 얼마나 중요한지 바로 확인할 수 있습니다.
          </div>
        </div>
      </div>
    );
  }

  /* ── 시작 전: 학년·성별 ── */
  if (started === null) {
    return (
      <div className="eden-card">
        <div className="eden-card-header">
          <i className="fas fa-clipboard-check"></i> {name} ({target})
        </div>
        <div className="eden-card-body">
          <p className="career-text">
            문항 {questions.length}개 · 약 {minutes}분. 결과 계산에 필요한 학년과 성별만 입력합니다. 이름·학교·이메일은 수집하지 않습니다.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <select className="career-select" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="학년">
              <option value="">학년 선택</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>
            <select className="career-select" value={gender} onChange={(e) => setGender(e.target.value)} aria-label="성별">
              <option value="">성별 선택</option>
              <option value="100323">남</option>
              <option value="100324">여</option>
            </select>
          </div>
          <button type="button" className="eden-btn eden-btn-primary" disabled={!grade || !gender} onClick={() => setStarted(Date.now())}>
            검사 시작
          </button>
          <div className="career-note">답을 고르는 데 정답은 없습니다. 평소의 나에 가장 가까운 것을 솔직하게 고르세요.</div>
        </div>
      </div>
    );
  }

  /* ── 문항 ── */
  let lastTitle = '';
  return (
    <div className="eden-card">
      <div className="eden-card-header">
        <i className="fas fa-clipboard-check"></i> {name} ({target})
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 400, color: '#64748b' }}>
          {answeredCount} / {questions.length}
        </span>
      </div>
      <div className="eden-card-body" style={{ paddingTop: 4 }}>
        {questions.map((q, idx) => {
          const showTitle = !!q.title && q.title !== lastTitle;
          if (q.title) lastTitle = q.title;
          const a = answers[q.key];
          const complete = isComplete(q, a);
          const needsInput = q.choices.some((c) => c.input && a?.vals.includes(c.val));
          return (
            <div key={q.key} id={`q-${q.key}`}>
              {showTitle && <div className="career-q-title">{q.title}</div>}
              <div className="career-q">
                <div className={`career-q-text${showMissing && !complete ? ' unanswered' : ''}`}>
                  {idx + 1}. {q.text}
                  {q.limit > 1 && <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>(중요한 순서대로 {q.limit}개 선택)</span>}
                </div>
                <div className="career-q-choices">
                  {q.choices.map((c) => {
                    const pos = a?.vals.indexOf(c.val) ?? -1;
                    return (
                      <label key={c.val} className={pos >= 0 ? 'checked' : ''}>
                        <input type={q.limit > 1 ? 'checkbox' : 'radio'} name={`q-${q.key}`} checked={pos >= 0} onChange={() => pick(q, c.val)} />
                        {q.limit > 1 && pos >= 0 && <strong style={{ marginRight: 4 }}>{pos + 1}순위</strong>}
                        {c.text}
                      </label>
                    );
                  })}
                </div>
                {needsInput && (
                  <input
                    type="text"
                    className="career-select"
                    style={{ marginTop: 8, width: '100%', maxWidth: 360 }}
                    placeholder="직접 입력 (띄어쓰기 없이)"
                    value={a?.input ?? ''}
                    onChange={(e) => setInput(q, e.target.value.replace(/\s/g, ''))}
                  />
                )}
                {q.tips && q.tips.length > 0 && <div className="career-q-tip">{q.tips.join(' · ')}</div>}
              </div>
            </div>
          );
        })}

        <div className="career-sticky-bar">
          <span style={{ fontSize: 13, color: missing.length > 0 && showMissing ? '#b91c1c' : '#64748b' }}>
            {missing.length > 0 ? `${missing.length}개 문항이 남았습니다.` : '모든 문항에 답했습니다.'}
          </span>
          <button type="button" className="eden-btn eden-btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? '결과 요청 중…' : '제출하고 결과 보기'}
          </button>
        </div>
        {error && <div className="career-note" style={{ color: '#b91c1c' }}>{error}</div>}
      </div>
    </div>
  );
}

function isComplete(q: RunnerQuestion, a: Answer | undefined): boolean {
  if (!a || a.vals.length < Math.max(1, q.limit)) return false;
  const inputChoice = q.choices.find((c) => c.input && a.vals.includes(c.val));
  if (inputChoice && !a.input) return false;
  return true;
}

/** v1: "1" | "8,1,4" | "1,8:방송계열" (기타 선택 시 값 뒤에 :주관식) */
function encodeV1(q: RunnerQuestion, a: Answer | undefined): string {
  if (!a) return '';
  return a.vals
    .map((v) => {
      const c = q.choices.find((x) => x.val === v);
      return c?.input && a.input ? `${v}:${a.input}` : v;
    })
    .join(',');
}

/** v2: 직접입력(type I) 보기는 입력한 글자가 값이 된다. 복수 답은 쉼표로 잇는다. */
function encodeV2(q: RunnerQuestion, a: Answer | undefined): string {
  if (!a) return '';
  return a.vals
    .map((v) => {
      const c = q.choices.find((x) => x.val === v);
      return c?.input && a.input ? a.input : v;
    })
    .join(',');
}
