'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function JoinStep2Form() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [message, setMessage] = useState('');

  async function checkEmail() {
    const res = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.used) {
      setMessage('이미 사용중인 이메일입니다.');
      setEmailChecked(false);
    } else {
      setMessage('사용 가능한 이메일입니다.');
      setEmailChecked(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailChecked) { setMessage('이메일 중복확인을 해주세요.'); return; }
    if (pw.length < 6) { setMessage('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) { setMessage('비밀번호는 영문과 숫자를 포함해야 합니다.'); return; }
    if (pw !== pw2) { setMessage('비밀번호가 일치하지 않습니다.'); return; }

    const form = document.querySelector('form') as HTMLFormElement;
    form.submit();
  }

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
      <h3 className="text-center mb-4">회원가입 - 정보입력</h3>
      {message && <div className="alert alert-info">{message}</div>}
      <form action="/api/auth/join" method="POST" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>이메일</label>
          <div className="input-group">
            <input type="email" name="email" className="form-control" value={email} onChange={e => { setEmail(e.target.value); setEmailChecked(false); }} required />
            <div className="input-group-append">
              <button type="button" className="btn btn-outline-secondary" onClick={checkEmail}>중복확인</button>
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
        <button type="submit" className="btn btn-primary btn-block">회원가입</button>
      </form>
    </div>
  );
}

export default function JoinStep2Page() {
  return (
    <Suspense fallback={<div className="container text-center mt-5">로딩중...</div>}>
      <JoinStep2Form />
    </Suspense>
  );
}
