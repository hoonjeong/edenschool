'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface QuestionItem {
  id: number;
  text: string;
  writer?: string;
  date?: string;
  answer?: string | null;
  answerBy?: string | null;
  answerDate?: string | null;
}

function AnswerItem({ q }: { q: QuestionItem }) {
  const router = useRouter();
  const [answer, setAnswer] = useState(q.answer || '');
  const [submitting, setSubmitting] = useState(false);
  const answered = !!q.answer;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/question/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, answer }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      } else {
        alert(data.error || '답변 등록에 실패했습니다.');
      }
    } catch {
      alert('답변 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        {/* 질문 */}
        <div className="d-flex justify-content-between">
          <strong>{q.writer || '알 수 없음'}</strong>
          <small className="text-muted">{q.date}</small>
        </div>
        <p className="mb-2 mt-1" style={{ whiteSpace: 'pre-wrap' }}>{q.text}</p>

        {/* 기존 답변 표시 */}
        {answered && (
          <div className="alert alert-light border mb-2" style={{ whiteSpace: 'pre-wrap' }}>
            <div className="d-flex justify-content-between mb-1">
              <strong className="text-primary">
                <i className="fas fa-reply mr-1" /> {q.answerBy || '선생님'} 답변
              </strong>
              <small className="text-muted">{q.answerDate}</small>
            </div>
            {q.answer}
          </div>
        )}

        {/* 답변 작성/수정 폼 */}
        <form onSubmit={handleSubmit}>
          <textarea
            className="form-control mb-2"
            rows={2}
            placeholder="답변을 입력하세요"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            {submitting ? '저장 중...' : answered ? '답변 수정' : '답변 등록'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function QuestionAnswerList({ questions }: { questions: QuestionItem[] }) {
  if (questions.length === 0) {
    return <p className="text-muted mt-2">질문이 없습니다.</p>;
  }
  return (
    <div className="mt-3">
      {questions.map((q) => (
        <AnswerItem key={q.id} q={q} />
      ))}
    </div>
  );
}
