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

  if (!userInfo) return <div className="container mt-5">정보를 불러올 수 없습니다.</div>;

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
    <div className="container" style={{ maxWidth: '600px', marginTop: '30px' }}>
      <h3 className="text-center mb-4">내 정보</h3>
      {message && <div className="alert alert-info">{message}</div>}

      <table className="table table-bordered">
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

      {!editing ? (
        <button className="btn btn-primary" onClick={() => setEditing(true)}>정보 수정</button>
      ) : (
        <div>
          <button className="btn btn-success mr-2" onClick={handleSave}>저장</button>
          <button className="btn btn-secondary" onClick={() => setEditing(false)}>취소</button>
        </div>
      )}

      <hr />
      {pwMessage && <div className="alert alert-info">{pwMessage}</div>}
      {!changingPw ? (
        <button className="btn btn-warning" onClick={() => setChangingPw(true)}>비밀번호 변경</button>
      ) : (
        <div>
          <div className="form-group">
            <label>현재 비밀번호</label>
            <input type="password" className="form-control" value={oldPw} onChange={e => setOldPw(e.target.value)} />
          </div>
          <div className="form-group">
            <label>새 비밀번호</label>
            <input type="password" className="form-control" value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <div className="form-group">
            <label>새 비밀번호 확인</label>
            <input type="password" className="form-control" value={newPw2} onChange={e => setNewPw2(e.target.value)} />
          </div>
          <button className="btn btn-success mr-2" onClick={handleChangePw}>변경</button>
          <button className="btn btn-secondary" onClick={() => setChangingPw(false)}>취소</button>
        </div>
      )}
    </div>
  );
}
