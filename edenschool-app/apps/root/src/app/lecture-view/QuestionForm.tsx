'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestionForm({ lectureId }: { lectureId: number }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lectureId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setText('');
        router.refresh();
      } else {
        alert(data.error || '질문 등록에 실패했습니다.');
      }
    } catch {
      alert('질문 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="eden-input-row">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="질문을 입력하세요"
          required
        />
        <button type="submit" className="eden-btn eden-btn-primary" disabled={submitting}>
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0' }}>질문을 올리면 선생님에게 전달됩니다.</p>
    </form>
  );
}
