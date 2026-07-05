'use client';

import { useState } from 'react';
import type { StudentMemo } from '@edenschool/common/types';

interface Props {
  studentId: number;
  initialMemos: StudentMemo[];
}

const PREVIEW_LEN = 40;

export default function StudentMemoSection({ studentId, initialMemos }: Props) {
  const [memos, setMemos] = useState<StudentMemo[]>(initialMemos);
  const [content, setContent] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const addMemo = async () => {
    const text = content.trim();
    if (!text) {
      alert('메모 내용을 입력하세요.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/student/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, content: text }),
      });
      if (!res.ok) {
        alert('메모 추가에 실패했습니다.');
        return;
      }
      const data = await res.json();
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setMemos([{ id: data.id, studentId, content: text, date }, ...memos]);
      setContent('');
    } finally {
      setSaving(false);
    }
  };

  const removeMemo = async (id: number) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/student/memo?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('삭제에 실패했습니다.');
      return;
    }
    setMemos(memos.filter((m) => m.id !== id));
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-light">
        <strong>메모</strong>
      </div>
      <div className="card-body">
        <div className="form-row align-items-end mb-3">
          <div className="col-md-9 mb-2">
            <textarea
              className="form-control"
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메모를 입력하세요."
            />
          </div>
          <div className="col-md-3 mb-2">
            <button className="btn btn-primary btn-block" onClick={addMemo} disabled={saving}>
              메모 추가
            </button>
          </div>
        </div>

        <table className="table table-bordered table-hover mb-0">
          <thead className="thead-light">
            <tr>
              <th>메모</th>
              <th style={{ width: '150px' }}>입력날짜</th>
              <th style={{ width: '70px' }}>삭제</th>
            </tr>
          </thead>
          <tbody>
            {memos.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center">등록된 메모가 없습니다.</td>
              </tr>
            ) : (
              memos.map((m) => {
                const isLong = m.content.length > PREVIEW_LEN;
                const expanded = expandedId === m.id;
                return (
                  <tr key={m.id}>
                    <td
                      style={{ cursor: isLong ? 'pointer' : 'default', whiteSpace: 'pre-wrap' }}
                      onClick={() => isLong && setExpandedId(expanded ? null : m.id)}
                      title={isLong ? '클릭하면 전체 메모가 표시됩니다.' : ''}
                    >
                      {expanded || !isLong
                        ? m.content
                        : `${m.content.slice(0, PREVIEW_LEN)}...`}
                    </td>
                    <td>{m.date}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => removeMemo(m.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
