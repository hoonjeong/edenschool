'use client';

import { useState } from 'react';

export default function FindPassPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setResult('');
    const res = await fetch('/api/auth/find-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.success) {
      setResult('임시 비밀번호가 SMS로 발송되었습니다.');
    } else {
      setError(data.error || '등록된 이메일을 찾을 수 없습니다.');
    }
  }

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <h3 className="text-center mb-4">비밀번호 찾기</h3>
      {result && <div className="alert alert-success">{result}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>이메일</label>
          <input type="email" className="form-control" placeholder="가입한 이메일" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-block">비밀번호 찾기</button>
      </form>
    </div>
  );
}
