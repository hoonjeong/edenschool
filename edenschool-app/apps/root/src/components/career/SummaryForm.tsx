'use client';

import { useState } from 'react';

/** 오늘의 직업 읽기 — 한 문장 요약 입력. 학원생 로그인 시 포트폴리오에 저장된다. */
export function SummaryForm({ jobCd, jobName, dateKey }: { jobCd: string; jobName: string; dateKey: string }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const wordCount = text.trim().length;

  const submit = async () => {
    const summary = text.trim();
    if (summary.length < 10) {
      alert('핵심 내용을 한 문장(10자 이상)으로 정리해 주세요.');
      return;
    }
    setState('saving');
    try {
      const res = await fetch('/api/career/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'summary', refId: jobCd, title: `${dateKey} ${jobName}`, content: summary }),
      });
      if (res.status === 401) {
        setMessage('요약을 기록으로 남기려면 학원생 로그인이 필요합니다. 지금 쓴 문장은 이 화면에만 남습니다.');
        setState('error');
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setState('saved');
      } else {
        setMessage(data.error || '저장하지 못했습니다.');
        setState('error');
      }
    } catch {
      setMessage('저장 중 오류가 발생했습니다.');
      setState('error');
    }
  };

  return (
    <div>
      <textarea
        className="career-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`${jobName}은(는) … 하는 직업이다.`}
        maxLength={300}
        disabled={state === 'saved'}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>{wordCount}자 / 300자 · 핵심어를 빠뜨리지 않으면서 한 문장으로</span>
        {state === 'saved' ? (
          <span className="eden-badge eden-badge-success">
            <i className="fas fa-check" style={{ marginRight: 4 }}></i> 저장됨 · <a href="/career/portfolio" style={{ marginLeft: 4 }}>포트폴리오 보기</a>
          </span>
        ) : (
          <button type="button" className="eden-btn eden-btn-primary eden-btn-sm" onClick={submit} disabled={state === 'saving'}>
            {state === 'saving' ? '저장 중…' : '요약 저장'}
          </button>
        )}
      </div>
      {state === 'error' && <div className="career-note" style={{ color: '#b91c1c' }}>{message}</div>}
    </div>
  );
}
