'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface QuestionFormProps {
  lectureId: number;
  userId: number;
}

export default function QuestionForm({ lectureId, userId }: QuestionFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('질문 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecture_id: lectureId,
          content,
          user_id: userId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setContent('');
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
      <div className="form-group">
        <textarea
          className="form-control"
          rows={3}
          placeholder="질문을 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary btn-sm mt-1"
        disabled={submitting}
      >
        {submitting ? '등록 중...' : '질문 등록'}
      </button>
    </form>
  );
}
