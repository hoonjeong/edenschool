'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PortfolioDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/career/portfolio?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) alert(data.error || '삭제하지 못했습니다.');
      else router.refresh();
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button type="button" className="eden-btn eden-btn-danger eden-btn-sm" onClick={handleDelete} disabled={deleting}>
      {deleting ? '삭제중...' : '삭제'}
    </button>
  );
}
