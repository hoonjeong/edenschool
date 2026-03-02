'use client';

import { useState, FormEvent } from 'react';
import { isValidPassword, PASSWORD_RULES } from '@edenschool/common/validation';

export default function AdminJoinPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkNumberInput, setCheckNumberInput] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');

  const [emailCheck, setEmailCheck] = useState(false);
  const [phoneCheck, setPhoneCheck] = useState(false);
  const [showCheckNumber, setShowCheckNumber] = useState(false);

  const [emailMsg, setEmailMsg] = useState('');
  const [emailMsgType, setEmailMsgType] = useState<'success' | 'danger'>('success');
  const [showEmailMsg, setShowEmailMsg] = useState(false);

  const [phoneMsg, setPhoneMsg] = useState('');
  const [phoneMsgType, setPhoneMsgType] = useState<'success' | 'danger'>('success');
  const [showPhoneMsg, setShowPhoneMsg] = useState(false);

  const pw1Valid = pw1 !== '' && isValidPassword(pw1);
  const pw2Valid = pw2 !== '' && pw1 === pw2;
  const showPw1Msg = pw1 !== '';
  const showPw2Msg = pw2 !== '';

  async function checkEmail() {
    if (email === '') {
      setEmailMsgType('danger');
      setEmailMsg('이메일을 입력해주세요.');
      setShowEmailMsg(true);
      return;
    }
    try {
      const res = await fetch('/api/admin/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.text();
      if (data === 'OK') {
        setEmailMsgType('success');
        setEmailMsg('사용가능한 이메일입니다.');
        setEmailCheck(true);
      } else {
        setEmailMsgType('danger');
        setEmailMsg('이미 사용중인 이메일입니다.');
        setEmailCheck(false);
      }
      setShowEmailMsg(true);
    } catch {
      setEmailMsgType('danger');
      setEmailMsg('이메일 확인 중 오류가 발생했습니다.');
      setShowEmailMsg(true);
    }
  }

  async function checkPhone() {
    if (phone === '') {
      setPhoneMsgType('danger');
      setPhoneMsg('핸드폰 번호를 입력해주세요.');
      setShowPhoneMsg(true);
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
        setPhoneMsgType('danger');
        setPhoneMsg('이든배움국어학원 선생님만 가입 가능합니다. 학원으로 문의 부탁드립니다.');
        setPhoneCheck(false);
      } else if (data === 'SMS_FAIL') {
        setPhoneMsgType('danger');
        setPhoneMsg('문자 발송에 실패했습니다. 다시 시도해주세요.');
        setPhoneCheck(false);
      } else {
        setPhoneMsgType('success');
        setPhoneMsg('인증번호를 입력해주세요.');
        setShowCheckNumber(true);
      }
      setShowPhoneMsg(true);
    } catch {
      setPhoneMsgType('danger');
      setPhoneMsg('인증 요청 중 오류가 발생했습니다.');
      setShowPhoneMsg(true);
    }
  }

  async function checkNumber() {
    if (checkNumberInput === '') {
      setPhoneCheck(false);
      setPhoneMsgType('danger');
      setPhoneMsg('인증번호를 입력해주세요.');
      setShowPhoneMsg(true);
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
        setPhoneCheck(true);
        setPhoneMsgType('success');
        setPhoneMsg('핸드폰 인증이 완료되었습니다.');
      } else if (data === 'WRONG') {
        setPhoneCheck(false);
        setPhoneMsgType('danger');
        setPhoneMsg('인증번호가 일치하지 않습니다. 다시 입력해주세요.');
      } else if (data === 'NO_REQUEST') {
        setPhoneCheck(false);
        setPhoneMsgType('danger');
        setPhoneMsg('인증 요청 내역이 없습니다. 인증번호를 다시 요청해주세요.');
      } else {
        setPhoneCheck(false);
        setPhoneMsgType('danger');
        setPhoneMsg('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      setShowPhoneMsg(true);
    } catch {
      setPhoneMsgType('danger');
      setPhoneMsg('인증 확인 중 오류가 발생했습니다.');
      setShowPhoneMsg(true);
    }
  }

  function handleSubmit(e: FormEvent) {
    if (!emailCheck) {
      e.preventDefault();
      alert('이메일 중복확인을 해주세요.');
      return;
    }
    if (!phoneCheck) {
      e.preventDefault();
      alert('핸드폰 인증을 해주세요.');
      return;
    }
    if (!pw1Valid) {
      e.preventDefault();
      alert(PASSWORD_RULES);
      return;
    }
    if (!pw2Valid) {
      e.preventDefault();
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') e.preventDefault();
  }

  return (
    <div className="admin-auth-box">
      <div className="admin-auth-header">
        <div className="auth-icon">
          <i className="fas fa-user-plus"></i>
        </div>
        <h4>회원가입</h4>
        <p>이든배움학원 선생님 확인을 위해 정확한 정보를 입력해주세요</p>
      </div>

      <form action="/api/admin/auth/join" method="post" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>이메일</label>
          <div className="input-group">
            <input
              name="email"
              type="email"
              placeholder="이메일을 입력하세요"
              className="form-control"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailCheck(false); }}
              onKeyDown={handleKeyDown}
            />
            <div className="input-group-append">
              <button type="button" className="btn btn-primary" onClick={checkEmail}>중복확인</button>
            </div>
          </div>
        </div>
        {showEmailMsg && (
          <div className={`alert alert-${emailMsgType}`}>{emailMsg}</div>
        )}

        {/* Phone */}
        <div className="form-group">
          <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>핸드폰번호</label>
          <div className="input-group">
            <input
              name="phone"
              type="text"
              placeholder="010-0000-0000"
              className="form-control"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="input-group-append">
              <button type="button" className="btn btn-primary" onClick={checkPhone}>인증요청</button>
            </div>
          </div>
        </div>

        {/* Verification code */}
        {showCheckNumber && (
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
                <button type="button" className="btn btn-primary" onClick={checkNumber}>확인</button>
              </div>
            </div>
          </div>
        )}
        {showPhoneMsg && (
          <div className={`alert alert-${phoneMsgType}`}>{phoneMsg}</div>
        )}

        {/* Password */}
        <div className="form-group">
          <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>비밀번호</label>
          <input
            name="pw1"
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

        {/* Password confirm */}
        <div className="form-group">
          <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 4 }}>비밀번호 확인</label>
          <input
            name="pw2"
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

        {/* Submit */}
        <div className="form-group" style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn-auth">회원가입</button>
        </div>
      </form>

      <div className="auth-links">
        <a href="/admin/login">로그인</a>
        <span className="divider">|</span>
        <a href="/admin/find-admin-email">이메일 찾기</a>
        <span className="divider">|</span>
        <a href="/admin/find-admin-pass">비밀번호 찾기</a>
      </div>
    </div>
  );
}
