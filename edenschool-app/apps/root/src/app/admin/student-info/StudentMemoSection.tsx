'use client';

import { useState } from 'react';
import type { StudentMemo } from '@edenschool/common/types';

interface Props {
  initialMemos: StudentMemo[];
}

const PREVIEW_LEN = 40;

// 원장 화면 전용 — 상담기록 조회(읽기 전용). 저장/삭제 기능 없음.
export default function StudentMemoSection({ initialMemos }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="card mb-4 border-secondary">
      <div className="card-header bg-secondary text-white">
        <strong>📝 상담기록</strong> <small>(조회 전용)</small>
      </div>
      <div className="card-body">
        <table className="table table-bordered table-hover mb-0">
          <thead className="thead-light">
            <tr>
              <th>상담내용</th>
              <th style={{ width: '150px' }}>입력날짜</th>
            </tr>
          </thead>
          <tbody>
            {initialMemos.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center">등록된 상담기록이 없습니다.</td>
              </tr>
            ) : (
              initialMemos.map((m) => {
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
