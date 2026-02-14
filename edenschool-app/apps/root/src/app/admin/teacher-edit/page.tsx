'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function TeacherEditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/teacher?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.teacher) {
          setName(data.teacher.name || '');
          setEmail(data.teacher.email || '');
          setPhone(data.teacher.phone || '');
        }
      })
      .catch(() => alert('선생님 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

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

    setSaving(true);
    try {
      const res = await fetch('/api/admin/teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id), name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        alert('수정되었습니다.');
        router.push('/admin/teacher-manager');
      } else {
        alert(data.error || '수정에 실패했습니다.');
      }
    } catch {
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '720px' }}>
      <h4>선생님 정보 수정</h4>
      <hr />
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>이름</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>이메일</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
          />
        </div>
        <div className="form-group">
          <label>핸드폰번호</label>
          <input
            type="text"
            className="form-control"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="form-group mt-4">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '수정 중...' : '수정'}
          </button>
          <a href="/admin/teacher-manager" className="btn btn-secondary ml-2">목록으로</a>
        </div>
      </form>
    </div>
  );
}

export default function TeacherEditPage() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <TeacherEditContent />
    </Suspense>
  );
}
