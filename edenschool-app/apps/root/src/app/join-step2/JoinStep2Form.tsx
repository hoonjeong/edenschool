'use client';

import { useState } from 'react';

interface Props {
  name: string;
  initialError?: string;
}

export function JoinStep2Form({ name, initialError = '' }: Props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [message, setMessage] = useState(initialError);
  const [messageType, setMessageType] = useState<'info' | 'danger' | 'success'>(
    initialError ? 'danger' : 'info',
  );

  function fail(text: string) {
    setMessage(text);
    setMessageType('danger');
  }

  async function checkEmail() {
    if (!email) {
      fail('이메일을 입력해주세요.');
      return;
    }
    const res = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.used) {
      fail('이미 사용중인 이메일입니다.');
      setEmailChecked(false);
    } else {
      setMessage('사용 가능한 이메일입니다.');
      setMessageType('success');
      setEmailChecked(true);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!emailChecked) { e.preventDefault(); fail('이메일 중복확인을 해주세요.'); return; }
    if (pw.length < 8) { e.preventDefault(); fail('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) { e.preventDefault(); fail('비밀번호는 영문과 숫자를 포함해야 합니다.'); return; }
    if (pw !== pw2) { e.preventDefault(); fail('비밀번호가 일치하지 않습니다.'); return; }
    // 통과하면 기본 동작(폼 POST)에 맡긴다.
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

        {/* 인증으로 확정된 학생을 안내만 한다. 입력칸이 아니므로 전송되지 않고,
            서버는 세션의 studentId로 student 테이블을 다시 읽어 저장한다.
            (학부모 번호로 인증했을 때 형제자매·등록 오류로 엉뚱한 학생이 잡히면 여기서 알아챌 수 있다.) */}
        <div
          style={{
            padding: '12px 14px',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: '#f1f3f5',
            color: '#343a40',
            fontSize: '0.95rem',
          }}
        >
          <strong>{name}</strong> 학생으로 가입합니다.
        </div>

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
            <input type="password" name="pw" className="form-control" placeholder="영문+숫자 8자 이상" value={pw} onChange={e => setPw(e.target.value)} required />
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
