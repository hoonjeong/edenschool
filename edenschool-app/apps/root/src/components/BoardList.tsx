'use client';

import { useState } from 'react';
import type { BoardListItem } from '@/lib/board';

export type { BoardListItem };

export function BoardList({
  items,
  emptyText = '게시글이 없습니다.',
}: {
  items: BoardListItem[];
  emptyText?: string;
}) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((it) => it.subject.toLowerCase().includes(q))
    : items;

  return (
    <div>
      <div className="eden-search">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="제목 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="eden-board-list">
        {filtered.map((item) => (
          <a key={item.id} href={item.href} className="eden-board-item">
            <div className="eden-board-header">
              <span className="eden-board-title">
                {item.subject}
                <span
                  className={`eden-board-count${
                    (item.commentCount ?? 0) > 0 ? ' has-comments' : ''
                  }`}
                  title={`댓글 ${item.commentCount ?? 0}`}
                >
                  ({item.commentCount ?? 0})
                </span>
              </span>
              <i className="fas fa-chevron-right eden-board-arrow"></i>
            </div>
            {(item.thumbnail || item.preview) && (
              <div className="eden-board-body">
                {item.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="eden-board-thumb"
                    src={item.thumbnail}
                    alt={item.subject}
                    loading="lazy"
                  />
                )}
                {item.preview ? (
                  <p className="eden-board-preview">{item.preview}</p>
                ) : item.thumbnail ? (
                  <p className="eden-board-preview eden-board-preview-muted">
                    이미지 게시글입니다.
                  </p>
                ) : null}
              </div>
            )}

            {/* 정보영역: 작성자 · 작성일 · 조회수 (요약 아래 한 줄) */}
            <div className="eden-board-meta">
              {item.writer && <span className="eden-board-meta-writer">{item.writer}</span>}
              {item.date && <span>{item.date}</span>}
              <span className="eden-board-meta-views">
                조회 {(item.readCount ?? 0).toLocaleString('ko-KR')}
              </span>
            </div>
          </a>
        ))}
        {filtered.length === 0 && (
          <div className="eden-board-empty">
            {q ? '검색 결과가 없습니다.' : emptyText}
          </div>
        )}
      </div>
    </div>
  );
}
