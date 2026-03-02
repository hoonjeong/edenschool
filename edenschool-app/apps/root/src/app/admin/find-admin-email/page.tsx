'use client';

import { useState } from 'react';

export default function FindAdminEmailPage() {
  const [phone, setPhone] = useState('');
  const [checkNumberInput, setCheckNumberInput] = useState('');
  const [result, setResult] = useState('');

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showCheckNumber, setShowCheckNumber] = useState(false);

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'danger'>('success');
  const [showMsg, setShowMsg] = useState(false);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') e.preventDefault();
  }

  async function requestVerification() {
    if (phone === '') {
      setMsgType('danger');
      setMsg('핸드폰 번호를 입력해주세요.');
      setShowMsg(true);
      return;
    }
    try {
      const res = await fetch('/api/admin/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.text();
      if (data === 'FAIL') {
        setMsgType('danger');
        setMsg('등록되지 않은 핸드폰 번호입니다.');
      } else if (data === 'SMS_FAIL') {
        setMsgType('danger');
        setMsg('문자 발송에 실패했습니다. 다시 시도해주세요.');
      } else {
        setMsgType('success');
        setMsg('인증번호가 발송되었습니다.');
        setShowCheckNumber(true);
      }
      setShowMsg(true);
    } catch {
      setMsgType('danger');
      setMsg('인증 요청 중 오류가 발생했습니다.');
      setShowMsg(true);
    }
  }

  async function verifyCode() {
    if (checkNumberInput === '') {
      setMsgType('danger');
      setMsg('인증번호를 입력해주세요.');
      setShowMsg(true);
      return;
    }

    try {
      const res = await fetch('/api/admin/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: checkNumberInput.trim(), phone }),
      });
      const data = await res.text();

      if (data === 'OK') {
        setPhoneVerified(true);
        setMsgType('success');
        setMsg('인증이 완료되었습니다.');
        setShowMsg(true);
        findEmail();
      } else if (data === 'EXPIRED') {
        setMsgType('danger');
        setMsg('인증번호가 만료되었습니다. 다시 요청해주세요.');
        setShowMsg(true);
      } else if (data === 'WRONG') {
        setMsgType('danger');
        setMsg('인증번호가 다릅니다. 다시 입력해주세요.');
        setShowMsg(true);
      } else if (data === 'NO_REQUEST') {
        setMsgType('danger');
        setMsg('인증 요청 내역이 없습니다. 인증번호를 다시 요청해주세요.');
        setShowMsg(true);
      } else {
        setMsgType('danger');
        setMsg('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setShowMsg(true);
      }
    } catch {
      setMsgType('danger');
      setMsg('인증 확인 중 오류가 발생했습니다.');
      setShowMsg(true);
    }
  }

  async function findEmail() {
    try {
      const res = await fetch('/api/admin/auth/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.text();
      setResult(data);
    } catch {
      setResult('이메일 찾기 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="admin-auth-box">
      <div className="admin-auth-header">
        <div className="auth-icon">
          <i className="fas fa-envelope"></i>
        </div>
        <h4>이메일 찾기</h4>
        <p>핸드폰 인증 후 가입된 이메일을 확인할 수 있습니다</p>
      </div>

      {/* Phone input */}
      <div className="form-group">
        <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>핸드폰번호</label>
        <div className="input-group">
          <input
            type="text"
            placeholder="010-0000-0000"
            className="form-control"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={phoneVerified}
          />
          <div className="input-group-append">
            <button
              type="button"
              className="btn btn-primary"
              onClick={requestVerification}
              disabled={phoneVerified}
            >
              인증요청
            </button>
          </div>
        </div>
      </div>

      {/* Verification code */}
      {showCheckNumber && !phoneVerified && (
        <div className="form-group">
          <div className="input-group">
            <input
              type="text"
              placeholder="인증번호 입력"
              className="form-control"
              value={checkNumberInput}
              onChange={(e) => setCheckNumberInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="input-group-append">
              <button type="button" className="btn btn-primary" onClick={verifyCode}>확인</button>
            </div>
          </div>
        </div>
      )}

      {showMsg && (
        <div className={`alert alert-${msgType}`}>{msg}</div>
      )}

      {/* Result (shown after verification) */}
      {phoneVerified && result && (
        <div className="alert alert-info" style={{ textAlign: 'center', fontSize: 15, fontWeight: 500 }}>
          {result}
        </div>
      )}

      <div className="auth-links">
        <a href="/admin/login">로그인</a>
        <span className="divider">|</span>
        <a href="/admin/join">회원가입</a>
        <span className="divider">|</span>
        <a href="/admin/find-admin-pass">비밀번호 찾기</a>
      </div>
    </div>
  );
}
