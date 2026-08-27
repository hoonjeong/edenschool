'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function JoinForm({ initialError = '' }: { initialError?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState('S');
  const [message, setMessage] = useState(initialError);
  const [messageType, setMessageType] = useState<'info' | 'danger'>(initialError ? 'danger' : 'info');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [authCode, setAuthCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function fail(text: string) {
    setMessage(text);
    setMessageType('danger');
  }

  async function handleSendSms() {
    if (!phone || phone.replace(/-/g, '').length < 10) {
      fail('올바른 전화번호를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/check-join-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, phoneType }),
      });
      if (res.status === 429) {
        fail('요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요.');
        return;
      }
      const data = await res.json();
      if (data.error) {
        fail(data.error);
        return;
      }
      setStep('verify');
      setMessage('인증번호가 발송되었습니다.');
      setMessageType('info');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    if (!authCode) {
      fail('인증번호를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode.trim(), phone }),
      });
      if (res.status === 429) {
        fail('요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요.');
        return;
      }
      const data = await res.json();
      if (data.error) {
        fail(data.error);
        return;
      }
      // 인증 결과는 서버 세션에 저장됐다. 전화번호를 폼으로 넘기지 않고 이동만 한다.
      router.push('/join-step2');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="eden-auth-wrapper">
      <div className="eden-auth-box">
        <div className="eden-auth-header">
          <div className="auth-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h4>회원가입</h4>
          <p>학원에 등록된 전화번호로 인증 후 가입할 수 있습니다.</p>
        </div>

        {message && <div className={`alert alert-${messageType}`}>{message}</div>}

        <div className="form-group">
          <label>전화번호 유형</label>
          <select
            className="form-control"
            value={phoneType}
            disabled={step === 'verify'}
            onChange={e => setPhoneType(e.target.value)}
          >
            <option value="S">학생 전화번호</option>
            <option value="P">학부모 전화번호</option>
          </select>
        </div>

        <div className="form-group">
          <label>전화번호</label>
          <input
            type="tel"
            className="form-control"
            placeholder="전화번호 (-없이)"
            value={phone}
            disabled={step === 'verify'}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        {step === 'phone' && (
          <button className="btn-auth" onClick={handleSendSms} disabled={submitting}>
            인증번호 발송
          </button>
        )}

        {step === 'verify' && (
          <>
            <div className="form-group">
              <label>인증번호</label>
              <input type="text" className="form-control" placeholder="인증번호 입력" value={authCode} onChange={e => setAuthCode(e.target.value)} />
            </div>
            <button className="btn-auth" onClick={handleVerify} disabled={submitting}>인증 확인</button>
            <button className="btn-auth-secondary" onClick={handleSendSms} disabled={submitting}>인증번호 재발송</button>
          </>
        )}

        <div className="auth-links">
          <a href="/login">이미 계정이 있으신가요? 로그인</a>
        </div>
      </div>
    </div>
  );
}
