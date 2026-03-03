'use client';

import { useState } from 'react';
import { isValidPassword, PASSWORD_RULES } from '@edenschool/common/validation';

export function FindPassForm() {
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState('S');
  const [authCode, setAuthCode] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showAuthCode, setShowAuthCode] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'danger'>('info');

  const pw1Valid = pw1 !== '' && isValidPassword(pw1);
  const pw2Valid = pw2 !== '' && pw1 === pw2;
  const showPw1Msg = pw1 !== '';
  const showPw2Msg = pw2 !== '';

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
    setMessage('인증이 완료되었습니다. 새 비밀번호를 입력해주세요.');
    setMessageType('info');
  }

  async function resetPassword() {
    if (!pw1Valid) {
      setMessage(PASSWORD_RULES);
      setMessageType('danger');
      return;
    }
    if (!pw2Valid) {
      setMessage('비밀번호가 일치하지 않습니다.');
      setMessageType('danger');
      return;
    }
    const res = await fetch('/api/auth/find-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, phoneType, pw: pw1 }),
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
      alert('비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.');
      window.location.href = '/login';
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
          <p>전화번호 인증 후 새 비밀번호를 설정할 수 있습니다.</p>
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

        {phoneVerified && (
          <>
            <div className="form-group">
              <label>새 비밀번호</label>
              <input type="password" className="form-control" placeholder="영문+숫자 8자 이상" value={pw1} onChange={e => setPw1(e.target.value)} />
            </div>
            {showPw1Msg && pw1Valid && (
              <div className="alert alert-success">사용가능한 비밀번호입니다.</div>
            )}
            {showPw1Msg && !pw1Valid && (
              <div className="alert alert-danger">영문과 숫자를 포함하여 8자 이상이어야 합니다.</div>
            )}

            <div className="form-group">
              <label>비밀번호 확인</label>
              <input type="password" className="form-control" placeholder="비밀번호를 다시 입력하세요" value={pw2} onChange={e => setPw2(e.target.value)} />
            </div>
            {showPw2Msg && pw2Valid && (
              <div className="alert alert-success">비밀번호가 일치합니다.</div>
            )}
            {showPw2Msg && !pw2Valid && (
              <div className="alert alert-danger">비밀번호가 일치하지 않습니다.</div>
            )}

            <button className="btn-auth" onClick={resetPassword}>비밀번호 변경</button>
          </>
        )}

        <div className="auth-links">
          <a href="/login">로그인</a>
          <span className="divider">|</span>
          <a href="/find-email">이메일 찾기</a>
        </div>
      </div>
    </div>
  );
}
