'use client';

import { useState } from 'react';

interface UserInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface MyInfoClientProps {
  info: UserInfo;
}

export default function MyInfoClient({ info }: MyInfoClientProps) {
  const [phone, setPhone] = useState(info.phone || '');
  const [email, setEmail] = useState(info.email || '');
  const [beforePw, setBeforePw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [rePw, setRePw] = useState('');

  const [infoReadonly, setInfoReadonly] = useState(true);
  const [pwReadonly, setPwReadonly] = useState(true);
  const [changeButtonText, setChangeButtonText] = useState('회원정보 변경');
  const [changePwButtonText, setChangePwButtonText] = useState('비밀번호 변경');

  const pwRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;

  async function changeInfo() {
    if (infoReadonly) {
      setInfoReadonly(false);
      setChangeButtonText('변경 완료');
    } else {
      try {
        const res = await fetch('/api/admin/user/change-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, email }),
        });
        const data = await res.text();

        if (data === 'OK') {
          alert('변경이 완료되었습니다.');
          location.reload();
        } else if (data === 'EMAIL') {
          alert('이미 사용중인 이메일 입니다.');
        } else if (data === 'PHONE') {
          alert('이미 사용중인 핸드폰번호 입니다.');
        } else {
          alert('변경에 실패하였습니다. 학원으로 문의해주세요');
        }
      } catch {
        alert('변경에 실패하였습니다. 학원으로 문의해주세요');
      }
    }
  }

  async function changePw() {
    if (pwReadonly) {
      setPwReadonly(false);
      setChangePwButtonText('변경 완료');
    } else {
      if (!pwRegex.test(newPw)) {
        alert('비밀번호는 영문과 숫자를 포함하여 8자 이상이어야 합니다.');
        return;
      }
      if (newPw !== rePw) {
        alert('새로운 비밀번호가 일치하지 않습니다.');
        return;
      }

      try {
        const res = await fetch('/api/admin/user/change-pw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ beforepw: beforePw, newpw: newPw }),
        });
        const data = await res.text();

        if (data === 'OK') {
          alert('변경이 완료되었습니다.');
          location.reload();
        } else if (data === 'DIFF') {
          alert('기존 비밀번호가 일치하지 않습니다.');
        } else {
          alert('변경에 실패하였습니다. 학원으로 문의해주세요');
        }
      } catch {
        alert('변경에 실패하였습니다. 학원으로 문의해주세요');
      }
    }
  }

  function handleCancel() {
    location.reload();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '600px' }}>
          <table className="table table-striped">
            <tbody>
              <tr>
                <td>이름</td>
                <td>{info.name}</td>
              </tr>
              <tr>
                <td>핸드폰 번호</td>
                <td>
                  <input
                    type="text"
                    className="form-control"
                    readOnly={infoReadonly}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </td>
              </tr>
              <tr>
                <td>이메일</td>
                <td>
                  <input
                    type="email"
                    className="form-control"
                    readOnly={infoReadonly}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </td>
              </tr>
              <tr>
                <td>기존비밀번호 입력</td>
                <td>
                  <input
                    type="password"
                    className="form-control"
                    readOnly={pwReadonly}
                    value={beforePw}
                    onChange={(e) => setBeforePw(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>새비밀번호 입력</td>
                <td>
                  <input
                    type="password"
                    className="form-control"
                    readOnly={pwReadonly}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td>새비밀번호 재입력</td>
                <td>
                  <input
                    type="password"
                    className="form-control"
                    readOnly={pwReadonly}
                    value={rePw}
                    onChange={(e) => setRePw(e.target.value)}
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="text-center">
                  <button className="btn btn-primary" onClick={changeInfo}>{changeButtonText}</button>{' '}
                  <button className="btn btn-primary" onClick={changePw}>{changePwButtonText}</button>{' '}
                  <button className="btn btn-primary" onClick={handleCancel}>취소</button>
                </td>
              </tr>
            </tbody>
          </table>
    </div>
  );
}
