'use client';

import { useState } from 'react';

export default function FindAdminPassPage() {
  const [phone, setPhone] = useState('');
  const [checkNumberInput, setCheckNumberInput] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showCheckNumber, setShowCheckNumber] = useState(false);

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'danger'>('success');
  const [showMsg, setShowMsg] = useState(false);

  const pwRegex = /^.*(?=.{8})(?=.*[0-9])(?=.*[a-zA-Z]).*$/;
  const pw1Valid = pw1 !== '' && pwRegex.test(pw1);
  const pw2Valid = pw2 !== '' && pw1 === pw2;
  const showPw1Msg = pw1 !== '';
  const showPw2Msg = pw2 !== '';

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
      if (res.status === 429) {
        setMsgType('danger');
        setMsg('요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요.');
        setShowMsg(true);
        return;
      }
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
      if (res.status === 429) {
        setMsgType('danger');
        setMsg('요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요.');
        setShowMsg(true);
        return;
      }
      const data = await res.text();

      if (data === 'OK') {
        setPhoneVerified(true);
        setMsgType('success');
        setMsg('인증이 완료되었습니다. 새 비밀번호를 입력해주세요.');
      } else if (data === 'EXPIRED') {
        setMsgType('danger');
        setMsg('인증번호가 만료되었습니다. 다시 요청해주세요.');
      } else if (data === 'WRONG') {
        setMsgType('danger');
        setMsg('인증번호가 다릅니다. 다시 입력해주세요.');
      } else if (data === 'NO_REQUEST') {
        setMsgType('danger');
        setMsg('인증 요청 내역이 없습니다. 인증번호를 다시 요청해주세요.');
      } else {
        setMsgType('danger');
        setMsg('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      setShowMsg(true);
    } catch {
      setMsgType('danger');
      setMsg('인증 확인 중 오류가 발생했습니다.');
      setShowMsg(true);
    }
  }

  async function resetPassword() {
    if (!pw1Valid) {
      alert('비밀번호는 영문과 숫자를 포함하여 8글자 이상이어야 합니다.');
      return;
    }
    if (!pw2Valid) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const res = await fetch('/api/admin/auth/find-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pw: pw1 }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/admin/login';
      }
    } catch {
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="admin-auth-box">
      <div className="admin-auth-header">
        <div className="auth-icon">
          <i className="fas fa-key"></i>
        </div>
        <h4>비밀번호 찾기</h4>
        <p>핸드폰 인증 후 새 비밀번호를 설정할 수 있습니다</p>
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

      {/* New password fields (shown after verification) */}
      {phoneVerified && (
        <>
          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>새 비밀번호</label>
            <input
              type="password"
              placeholder="영문+숫자 8자 이상"
              className="form-control"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
            />
          </div>
          {showPw1Msg && pw1Valid && (
            <div className="alert alert-success">사용가능한 비밀번호입니다.</div>
          )}
          {showPw1Msg && !pw1Valid && (
            <div className="alert alert-danger">영문과 숫자를 포함하여 8글자 이상이어야 합니다.</div>
          )}

          <div className="form-group">
            <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>비밀번호 확인</label>
            <input
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              className="form-control"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
          </div>
          {showPw2Msg && pw2Valid && (
            <div className="alert alert-success">비밀번호가 일치합니다.</div>
          )}
          {showPw2Msg && !pw2Valid && (
            <div className="alert alert-danger">비밀번호가 일치하지 않습니다.</div>
          )}

          <div className="form-group" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-auth" onClick={resetPassword}>
              비밀번호 변경
            </button>
          </div>
        </>
      )}

      <div className="auth-links">
        <a href="/admin/login">로그인</a>
        <span className="divider">|</span>
        <a href="/admin/join">회원가입</a>
        <span className="divider">|</span>
        <a href="/admin/find-admin-email">이메일 찾기</a>
      </div>
    </div>
  );
}
