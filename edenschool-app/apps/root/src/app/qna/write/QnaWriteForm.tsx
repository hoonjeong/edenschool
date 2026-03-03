'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

function WriteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('id');

  const [subject, setSubject] = useState('');
  const [contents, setContents] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!editId) return;
    setFetching(true);
    fetch(`/api/qna?id=${editId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.post) {
          setSubject(data.post.subject || '');
          setContents(data.post.contents || '');
        } else {
          alert('게시글을 찾을 수 없습니다.');
          router.push('/qna');
        }
      })
      .catch(() => alert('게시글 조회 중 오류가 발생했습니다.'))
      .finally(() => setFetching(false));
  }, [editId, router]);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote'],
          ['link'],
          ['clean'],
        ],
      },
    }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert('제목을 입력하세요.');
      return;
    }
    if (!contents.trim() || contents === '<p><br></p>') {
      alert('내용을 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const body = editId
        ? { id: Number(editId), subject, contents }
        : { subject, contents };

      const res = await fetch('/api/qna', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        alert(editId ? '수정되었습니다.' : '등록되었습니다.');
        router.push(editId ? `/qna/${editId}` : '/qna');
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="eden-container">
        <div className="text-center" style={{ padding: 40 }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>{editId ? '질문 수정' : '질문 작성'}</h2>
      </div>

      <div className="eden-card">
        <div className="eden-card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>제목</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>내용</label>
              <div style={{ background: '#fff', minHeight: 350 }}>
                <ReactQuill
                  theme="snow"
                  value={contents}
                  onChange={(value: string) => setContents(value)}
                  modules={quillModules}
                  placeholder="내용을 입력하세요"
                  style={{ height: 300 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 50, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="eden-btn eden-btn-secondary"
                onClick={() => router.push('/qna')}
              >
                취소
              </button>
              <button
                type="submit"
                className="eden-btn eden-btn-primary"
                disabled={loading}
              >
                {loading ? '저장 중...' : editId ? '수정' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function QnaWriteForm() {
  return (
    <Suspense fallback={<div className="eden-container"><div className="text-center" style={{ padding: 40 }}>로딩중...</div></div>}>
      <WriteContent />
    </Suspense>
  );
}
