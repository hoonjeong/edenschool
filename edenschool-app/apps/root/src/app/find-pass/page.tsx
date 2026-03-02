'use client';

import { useState } from 'react';

export default function FindPassPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setResult('');
    const res = await fetch('/api/auth/find-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.status === 429) {
      setError('요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요.');
      return;
    }
    const data = await res.json();
    if (data.success) {
      setResult('임시 비밀번호가 SMS로 발송되었습니다.');
    } else {
      setError(data.error || '등록된 이메일을 찾을 수 없습니다.');
    }
  }

  return (
    <div className="eden-auth-wrapper">
      <div className="eden-auth-box">
        <div className="eden-auth-header">
          <div className="auth-icon">
            <i className="fas fa-key"></i>
          </div>
          <h4>비밀번호 찾기</h4>
          <p>가입한 이메일로 임시 비밀번호를 받을 수 있습니다.</p>
        </div>

        {result && <div className="alert alert-success">{result}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이메일</label>
            <input type="email" className="form-control" placeholder="가입한 이메일" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn-auth">비밀번호 찾기</button>
        </form>

        <div className="auth-links">
          <a href="/login">로그인</a>
          <span className="divider">|</span>
          <a href="/find-email">이메일 찾기</a>
        </div>
      </div>
    </div>
  );
}
