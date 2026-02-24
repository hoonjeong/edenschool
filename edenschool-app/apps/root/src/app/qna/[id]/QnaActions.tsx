'use client';

import { useRouter } from 'next/navigation';

export function QnaActions({ postId }: { postId: number }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/qna?id=${postId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('삭제되었습니다.');
        router.push('/qna');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <span style={{ display: 'inline-flex', gap: 8 }}>
      <a href={`/qna/write?id=${postId}`} className="eden-btn eden-btn-primary eden-btn-sm">
        <i className="fas fa-edit"></i> 수정
      </a>
      <button type="button" className="eden-btn eden-btn-danger eden-btn-sm" onClick={handleDelete}>
        <i className="fas fa-trash"></i> 삭제
      </button>
    </span>
  );
}
