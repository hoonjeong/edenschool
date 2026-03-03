'use client';

import { useState } from 'react';

export function FindEmailForm() {
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState('S');
  const [authCode, setAuthCode] = useState('');
  const [result, setResult] = useState('');

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showAuthCode, setShowAuthCode] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'danger'>('info');

  async function handleSendSms() {
    if (!phone) {
      setMessage('전화번호를 입력해주세요.');
      setMessageType('danger');
      return;
    }
    const res = await fetch('/api/auth/check-find-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, phoneType }),
    });
    if (res.status === 429) {
      setMessage('요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요.');
      setMessageType('danger');
      return;
    }
    const data = await res.json();
    if (data.error) {
      setMessage(data.error);
      setMessageType('danger');
    } else {
      setShowAuthCode(true);
      setMessage('인증번호가 발송되었습니다.');
      setMessageType('info');
    }
  }

  async function handleVerify() {
    if (!authCode) {
      setMessage('인증번호를 입력해주세요.');
      setMessageType('danger');
      return;
    }
    const res = await fetch('/api/auth/verify-find-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: authCode.trim(), phone }),
    });
    if (res.status === 429) {
      setMessage('요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요.');
      setMessageType('danger');
      return;
    }
    const data = await res.json();
    if (data.error) {
      setMessage(data.error);
      setMessageType('danger');
      return;
    }
    setPhoneVerified(true);
    setMessage('인증이 완료되었습니다.');
    setMessageType('info');
    findEmail();
  }

  async function findEmail() {
    const res = await fetch('/api/auth/find-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, phoneType }),
    });
    const data = await res.json();
    if (data.email) {
      setResult(`회원님의 가입 이메일은 ${data.email}입니다.`);
    } else {
      setResult(data.error || '등록된 이메일을 찾을 수 없습니다.');
    }
  }

  return (
    <div className="eden-auth-wrapper">
      <div className="eden-auth-box">
        <div className="eden-auth-header">
          <div className="auth-icon">
            <i className="fas fa-envelope"></i>
          </div>
          <h4>이메일 찾기</h4>
          <p>전화번호 인증 후 가입된 이메일을 확인할 수 있습니다.</p>
        </div>

        {message && <div className={`alert alert-${messageType}`}>{message}</div>}

        <div className="form-group">
          <label>전화번호 유형</label>
          <select className="form-control" value={phoneType} onChange={e => setPhoneType(e.target.value)} disabled={phoneVerified}>
            <option value="S">학생 전화번호</option>
            <option value="P">학부모 전화번호</option>
          </select>
        </div>

        <div className="form-group">
          <label>전화번호</label>
          <input type="tel" className="form-control" placeholder="전화번호 (-없이)" value={phone} onChange={e => setPhone(e.target.value)} disabled={phoneVerified} />
        </div>

        {!showAuthCode && !phoneVerified && (
          <button className="btn-auth" onClick={handleSendSms}>인증번호 발송</button>
        )}

        {showAuthCode && !phoneVerified && (
          <>
            <div className="form-group">
              <label>인증번호</label>
              <input type="text" className="form-control" placeholder="인증번호 입력" value={authCode} onChange={e => setAuthCode(e.target.value)} />
            </div>
            <button className="btn-auth" onClick={handleVerify}>인증 확인</button>
            <button className="btn-auth-secondary" onClick={handleSendSms}>인증번호 재발송</button>
          </>
        )}

        {phoneVerified && result && (
          <div className="alert alert-success" style={{ textAlign: 'center', fontSize: 15, fontWeight: 500 }}>
            {result}
          </div>
        )}

        <div className="auth-links">
          <a href="/login">로그인</a>
          <span className="divider">|</span>
          <a href="/find-pass">비밀번호 찾기</a>
        </div>
      </div>
    </div>
  );
}
