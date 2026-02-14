'use client';

import { useState } from 'react';

export default function FindEmailPage() {
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState('S');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setResult('');
    const res = await fetch('/api/auth/find-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, phoneType }),
    });
    const data = await res.json();
    if (data.email) {
      setResult(`이메일: ${data.email}`);
    } else {
      setError('등록된 이메일을 찾을 수 없습니다.');
    }
  }

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <h3 className="text-center mb-4">이메일 찾기</h3>
      {result && <div className="alert alert-success">{result}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>전화번호 유형</label>
          <select className="form-control" value={phoneType} onChange={e => setPhoneType(e.target.value)}>
            <option value="S">학생 전화번호</option>
            <option value="P">학부모 전화번호</option>
          </select>
        </div>
        <div className="form-group">
          <label>전화번호</label>
          <input type="tel" className="form-control" placeholder="전화번호 (-없이)" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-block">이메일 찾기</button>
      </form>
    </div>
  );
}
