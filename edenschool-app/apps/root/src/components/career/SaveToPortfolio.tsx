'use client';

import { useState } from 'react';

export type PortfolioKind = 'major' | 'job' | 'test' | 'summary';

/**
 * 「나의 진로 포트폴리오」 저장 버튼.
 * 학원생 로그인 세션이 없으면 API 가 401 을 돌려주고, 로그인 페이지로 안내한다.
 */
export function SaveToPortfolio({
  kind,
  refId,
  title,
  content,
  label = '포트폴리오에 저장',
}: {
  kind: PortfolioKind;
  refId: string;
  title: string;
  content?: string;
  label?: string;
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'dup' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const save = async () => {
    setState('saving');
    try {
      const res = await fetch('/api/career/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, refId, title, content }),
      });
      if (res.status === 401) {
        if (confirm('학원생 로그인 후 저장할 수 있습니다. 로그인 페이지로 이동할까요?')) {
          location.href = `/login?referer=${encodeURIComponent(location.pathname + location.search)}`;
        }
        setState('idle');
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setState(data.duplicated ? 'dup' : 'saved');
      } else {
        setMessage(data.error || '저장하지 못했습니다.');
        setState('error');
      }
    } catch {
      setMessage('저장 중 오류가 발생했습니다.');
      setState('error');
    }
  };

  if (state === 'saved') {
    return (
      <span className="eden-badge eden-badge-success">
        <i className="fas fa-check" style={{ marginRight: 4 }}></i> 저장됨 · <a href="/career/portfolio" style={{ marginLeft: 4 }}>포트폴리오 보기</a>
      </span>
    );
  }
  if (state === 'dup') {
    return (
      <span className="eden-badge eden-badge-info">
        이미 저장된 항목입니다 · <a href="/career/portfolio" style={{ marginLeft: 4 }}>포트폴리오 보기</a>
      </span>
    );
  }

  return (
    <span>
      <button type="button" className="eden-btn eden-btn-outline eden-btn-sm" onClick={save} disabled={state === 'saving'}>
        <i className="far fa-bookmark"></i> {state === 'saving' ? '저장 중…' : label}
      </button>
      {state === 'error' && <span style={{ marginLeft: 8, fontSize: 12, color: '#b91c1c' }}>{message}</span>}
    </span>
  );
}
