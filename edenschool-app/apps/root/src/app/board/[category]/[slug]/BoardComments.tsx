'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CommentData {
  id: number;
  text: string;
  isOwner: boolean;
  writer: string;
  date: string;
}

/**
 * 게시판 댓글 (등록/삭제).
 * API가 JSON 전용이라 질문게시판(QnaComments)과 동일하게 fetch 로 호출한다.
 * - 등록: POST /api/comment  { text, postId }
 * - 삭제: DELETE /api/comment/{id}
 */
export function BoardComments({
  postId,
  comments,
  isLoggedIn,
}: {
  postId: number;
  comments: CommentData[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), postId }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setText('');
        router.refresh();
      }
    } catch {
      alert('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/comment/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        router.refresh();
      }
    } catch {
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="eden-card" style={{ marginBottom: 20 }}>
      <div className="eden-card-header">
        <i className="fas fa-comments"></i> 댓글 ({comments.length})
      </div>
      <div className="eden-card-body">
        {isLoggedIn && (
          <form onSubmit={handleSubmit} style={{ marginBottom: comments.length > 0 ? 16 : 0 }}>
            <div className="eden-input-row">
              <input
                type="text"
                placeholder="댓글을 입력하세요"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={5000}
                required
              />
              <button type="submit" className="eden-btn eden-btn-primary" disabled={submitting}>
                {submitting ? '등록중...' : '등록'}
              </button>
            </div>
          </form>
        )}

        {comments.length > 0 ? (
          comments.map((c) => (
            <div key={c.id} className="eden-comment">
              <div className="eden-comment-header">
                <div>
                  <span className="eden-comment-author">{c.writer}</span>
                  <span className="eden-comment-date" style={{ marginLeft: 8 }}>{c.date}</span>
                </div>
                {c.isOwner && (
                  <button
                    type="button"
                    className="eden-btn eden-btn-danger eden-btn-sm"
                    onClick={() => handleDelete(c.id)}
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="eden-comment-text">{c.text}</p>
            </div>
          ))
        ) : (
          <div className="eden-empty" style={{ padding: '20px 0' }}>
            댓글이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
