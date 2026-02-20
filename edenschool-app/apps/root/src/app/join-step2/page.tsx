'use client';

import { useState } from 'react';
import { Suspense } from 'react';

function JoinStep2Form() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'danger' | 'success'>('info');

  async function checkEmail() {
    const res = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.used) {
      setMessage('이미 사용중인 이메일입니다.');
      setMessageType('danger');
      setEmailChecked(false);
    } else {
      setMessage('사용 가능한 이메일입니다.');
      setMessageType('success');
      setEmailChecked(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailChecked) { setMessage('이메일 중복확인을 해주세요.'); setMessageType('danger'); return; }
    if (pw.length < 6) { setMessage('비밀번호는 6자 이상이어야 합니다.'); setMessageType('danger'); return; }
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) { setMessage('비밀번호는 영문과 숫자를 포함해야 합니다.'); setMessageType('danger'); return; }
    if (pw !== pw2) { setMessage('비밀번호가 일치하지 않습니다.'); setMessageType('danger'); return; }

    const form = document.querySelector('form') as HTMLFormElement;
    form.submit();
  }

  return (
    <div className="eden-auth-wrapper">
      <div className="eden-auth-box">
        <div className="eden-auth-header">
          <div className="auth-icon">
            <i className="fas fa-user-edit"></i>
          </div>
          <h4>회원가입</h4>
          <p>계정 정보를 입력해주세요.</p>
        </div>

        {message && <div className={`alert alert-${messageType}`}>{message}</div>}

        <form action="/api/auth/join" method="POST" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이메일</label>
            <div className="input-group">
              <input type="email" name="email" className="form-control" placeholder="이메일 입력" value={email} onChange={e => { setEmail(e.target.value); setEmailChecked(false); }} required />
              <div className="input-group-append">
                <button type="button" className="btn" onClick={checkEmail}>중복확인</button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input type="password" name="pw" className="form-control" placeholder="영문+숫자 6자 이상" value={pw} onChange={e => setPw(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>비밀번호 확인</label>
            <input type="password" className="form-control" placeholder="비밀번호 확인" value={pw2} onChange={e => setPw2(e.target.value)} required />
          </div>
          <button type="submit" className="btn-auth">회원가입</button>
        </form>

        <div className="auth-links">
          <a href="/login">이미 계정이 있으신가요? 로그인</a>
        </div>
      </div>
    </div>
  );
}

export default function JoinStep2Page() {
  return (
    <Suspense fallback={<div className="eden-auth-wrapper"><div className="eden-auth-box" style={{ textAlign: 'center' }}>로딩중...</div></div>}>
      <JoinStep2Form />
    </Suspense>
  );
}
