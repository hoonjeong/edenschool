'use client';

import { useState } from 'react';

interface Props {
  userInfo: Record<string, any> | null;
  classList: string[];
  userId: number;
}

export function MyInfoClient({ userInfo, classList, userId }: Props) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(userInfo?.email || '');
  const [sphone, setSphone] = useState(userInfo?.sphone || '');
  const [pphone, setPphone] = useState(userInfo?.pphone || '');
  const [message, setMessage] = useState('');

  const [changingPw, setChangingPw] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwMessage, setPwMessage] = useState('');

  if (!userInfo) return <div className="eden-container"><div className="eden-empty"><i className="fas fa-exclamation-circle"></i>정보를 불러올 수 없습니다.</div></div>;

  async function handleSave() {
    const res = await fetch('/api/user/change-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, sphone, pphone }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage('정보가 수정되었습니다.');
      setEditing(false);
    } else {
      setMessage(data.error || '수정 실패');
    }
  }

  async function handleChangePw() {
    if (newPw.length < 6 || !/[a-zA-Z]/.test(newPw) || !/[0-9]/.test(newPw)) {
      setPwMessage('비밀번호는 영문+숫자 6자 이상이어야 합니다.');
      return;
    }
    if (newPw !== newPw2) { setPwMessage('새 비밀번호가 일치하지 않습니다.'); return; }

    const res = await fetch('/api/user/change-pw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPw, newPw }),
    });
    const data = await res.json();
    if (data.success) {
      setPwMessage('비밀번호가 변경되었습니다.');
      setChangingPw(false);
      setOldPw(''); setNewPw(''); setNewPw2('');
    } else {
      setPwMessage(data.error || '변경 실패');
    }
  }

  return (
    <div className="eden-container" style={{ maxWidth: 700 }}>
      <div className="eden-page-header">
        <h2>내 정보</h2>
      </div>

      {message && <div className="alert alert-info" style={{ borderRadius: 8, fontSize: 14 }}>{message}</div>}

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-user"></i> 기본 정보
        </div>
        <table className="eden-info-table">
          <tbody>
            <tr><th>이름</th><td>{userInfo.name}</td></tr>
            <tr><th>학년</th><td>{userInfo.grade}{userInfo.year}</td></tr>
            <tr><th>학교</th><td>{userInfo.school}</td></tr>
            <tr><th>반</th><td>{classList.join(', ') || '-'}</td></tr>
            <tr>
              <th>이메일</th>
              <td>{editing ? <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} /> : email}</td>
            </tr>
            <tr>
              <th>학생 전화</th>
              <td>{editing ? <input className="form-control" value={sphone} onChange={e => setSphone(e.target.value)} /> : sphone}</td>
            </tr>
            <tr>
              <th>학부모 전화</th>
              <td>{editing ? <input className="form-control" value={pphone} onChange={e => setPphone(e.target.value)} /> : pphone}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 8 }}>
          {!editing ? (
            <button className="eden-btn eden-btn-primary" onClick={() => setEditing(true)}>
              <i className="fas fa-edit"></i> 정보 수정
            </button>
          ) : (
            <>
              <button className="eden-btn eden-btn-success" onClick={handleSave}>저장</button>
              <button className="eden-btn eden-btn-secondary" onClick={() => setEditing(false)}>취소</button>
            </>
          )}
        </div>
      </div>

      <div className="eden-card">
        <div className="eden-card-header">
          <i className="fas fa-lock"></i> 비밀번호 변경
        </div>
        <div className="eden-card-body">
          {pwMessage && <div className="alert alert-info" style={{ borderRadius: 8, fontSize: 14 }}>{pwMessage}</div>}
          {!changingPw ? (
            <button className="eden-btn eden-btn-warning" onClick={() => setChangingPw(true)}>
              <i className="fas fa-key"></i> 비밀번호 변경
            </button>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>현재 비밀번호</label>
                <input type="password" className="form-control" style={{ maxWidth: 400, borderRadius: 6 }} value={oldPw} onChange={e => setOldPw(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>새 비밀번호</label>
                <input type="password" className="form-control" style={{ maxWidth: 400, borderRadius: 6 }} value={newPw} onChange={e => setNewPw(e.target.value)} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#334155', marginBottom: 4 }}>새 비밀번호 확인</label>
                <input type="password" className="form-control" style={{ maxWidth: 400, borderRadius: 6 }} value={newPw2} onChange={e => setNewPw2(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="eden-btn eden-btn-success" onClick={handleChangePw}>변경</button>
                <button className="eden-btn eden-btn-secondary" onClick={() => setChangingPw(false)}>취소</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
