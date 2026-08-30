'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 관심 직업/학과 삭제 버튼.
 * API 가 DELETE /api/dream/{id} 만 받으므로 폼 POST 대신 fetch 로 호출한다.
 * (기존 폼은 존재하지 않는 /api/dream/delete 로 POST 해서 405 가 났다.)
 */
export function DreamDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('삭제하시겠습니까?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/dream/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        router.refresh();
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      className="eden-btn eden-btn-danger eden-btn-sm"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? '삭제중...' : '삭제'}
    </button>
  );
}
