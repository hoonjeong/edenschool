'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_ROLES, adminRoleLabel } from '@/lib/admin-roles';

export function NewTeacherForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('T');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    if (!phone.trim()) {
      alert('핸드폰번호를 입력해주세요.');
      return;
    }

    if (!confirm(`이름: ${name}\n핸드폰: ${phone}\n역할: ${adminRoleLabel(code)}\n\n추가하시겠습니까?`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), code }),
      });
      const data = await res.json();
      if (data.success) {
        alert('선생님이 추가되었습니다.');
        router.push('/admin/teacher-manager');
      } else {
        alert(data.error || '추가에 실패했습니다.');
      }
    } catch {
      alert('추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '720px' }}>
      <h4>선생님 추가</h4>
      <hr />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>이름</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>
        <div className="form-group">
          <label>핸드폰번호</label>
          <input
            type="text"
            className="form-control"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
          />
        </div>
        <div className="form-group">
          <label>역할</label>
          <select
            className="form-control"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          >
            {ADMIN_ROLES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group mt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '추가 중...' : '추가하기'}
          </button>
          <a href="/admin/teacher-manager" className="btn btn-secondary ml-2">취소</a>
        </div>
      </form>
    </div>
  );
}
