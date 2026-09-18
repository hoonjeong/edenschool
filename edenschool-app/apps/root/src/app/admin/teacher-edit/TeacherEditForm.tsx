'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ASSIGNABLE_ROLES, adminRoleLabel } from '@/lib/admin-roles';
import { ACA_PARTS, findAcaPart } from '@/lib/aca-parts';

function TeacherEditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('T');
  // '' = 미지정. 미지정 상태로 저장하면 aca_part 행을 건드리지 않는다.
  const [acaPart, setAcaPart] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedPart = findAcaPart(acaPart);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/teacher?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.teacher) {
          setName(data.teacher.name || '');
          setEmail(data.teacher.email || '');
          setPhone(data.teacher.phone || '');
          setCode(data.teacher.code || 'T');
        }
        if (data.acaPart && findAcaPart(data.acaPart.part)) {
          setAcaPart(String(data.acaPart.part));
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
        body: JSON.stringify({
          id: Number(id),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          code,
          ...(selectedPart ? { acaPart: selectedPart.part } : {}),
        }),
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
        <div className="form-group">
          <label>역할</label>
          <select
            className="form-control"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          >
            {/* 기존 운영진(O) 계정은 폼에서 역할이 바뀌지 않도록 현재 값을 그대로 노출 */}
            {!ASSIGNABLE_ROLES.some((r) => r.code === code) && (
              <option value={code}>{adminRoleLabel(code)}</option>
            )}
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>근무 관</label>
          <select
            className="form-control"
            value={acaPart}
            onChange={(e) => setAcaPart(e.target.value)}
          >
            <option value="">미지정 (변경 안 함)</option>
            {ACA_PARTS.map((p) => (
              <option key={p.part} value={p.part}>
                {p.label}
              </option>
            ))}
          </select>
          <small className="form-text text-muted">
            {selectedPart
              ? `문자 발송 시 발신번호: ${selectedPart.phone}`
              : '관을 선택하지 않으면 기존 근무 관 정보를 그대로 둡니다.'}
          </small>
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

export function TeacherEditForm() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <TeacherEditContent />
    </Suspense>
  );
}
