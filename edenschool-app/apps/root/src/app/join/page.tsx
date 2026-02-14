'use client';

import { useState } from 'react';

export default function JoinPage() {
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState('S');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [authCode, setAuthCode] = useState('');

  async function handleSendSms() {
    if (!phone || phone.length < 10) {
      setMessage('올바른 전화번호를 입력해주세요.');
      return;
    }
    const res = await fetch('/api/auth/check-join-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, phoneType }),
    });
    const data = await res.json();
    if (data.error) {
      setMessage(data.error);
    } else {
      setStep('verify');
      setMessage('인증번호가 발송되었습니다.');
    }
  }

  async function handleVerify() {
    if (!authCode) {
      setMessage('인증번호를 입력해주세요.');
      return;
    }

    const res = await fetch('/api/auth/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: authCode }),
    });
    const data = await res.json();

    if (data.error) {
      setMessage(data.error);
      return;
    }

    // Redirect to join-step2 with phone info
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/join-step2';
    const phoneInput = document.createElement('input');
    phoneInput.type = 'hidden'; phoneInput.name = 'phone'; phoneInput.value = phone;
    const typeInput = document.createElement('input');
    typeInput.type = 'hidden'; typeInput.name = 'phoneType'; typeInput.value = phoneType;
    form.appendChild(phoneInput);
    form.appendChild(typeInput);
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '50px' }}>
      <h3 className="text-center mb-4">회원가입</h3>
      <p className="text-center text-muted">학원에 등록된 전화번호로 인증 후 가입할 수 있습니다.</p>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="form-group">
        <label>전화번호 유형</label>
        <select className="form-control" value={phoneType} onChange={e => setPhoneType(e.target.value)}>
          <option value="S">학생 전화번호</option>
          <option value="P">학부모 전화번호</option>
        </select>
      </div>

      <div className="form-group">
        <label>전화번호</label>
        <input type="tel" className="form-control" placeholder="전화번호 (-없이)" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>

      {step === 'phone' && (
        <button className="btn btn-primary btn-block" onClick={handleSendSms}>인증번호 발송</button>
      )}

      {step === 'verify' && (
        <>
          <div className="form-group">
            <label>인증번호</label>
            <input type="text" className="form-control" placeholder="인증번호 입력" value={authCode} onChange={e => setAuthCode(e.target.value)} />
          </div>
          <button className="btn btn-success btn-block" onClick={handleVerify}>인증 확인</button>
          <button className="btn btn-secondary btn-block mt-2" onClick={handleSendSms}>인증번호 재발송</button>
        </>
      )}
    </div>
  );
}
