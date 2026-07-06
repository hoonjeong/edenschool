'use client';

import { useState } from 'react';

export interface BoardListItem {
  id: number;
  subject: string;
  href: string;
  preview?: string;
  commentCount?: number;
}

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
            <div className="eden-board-main">
              <div className="eden-board-title-row">
                <span className="eden-board-title">{item.subject}</span>
                <span
                  className={`eden-board-badge${
                    (item.commentCount ?? 0) > 0 ? ' has-comments' : ''
                  }`}
                >
                  <i className="far fa-comment"></i>
                  {item.commentCount ?? 0}
                </span>
              </div>
              {item.preview && (
                <p className="eden-board-preview">{item.preview}</p>
              )}
            </div>
            <i className="fas fa-chevron-right eden-board-arrow"></i>
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
