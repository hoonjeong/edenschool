'use client';

import { useState, useRef, useEffect } from 'react';

export function SearchTable({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rows = containerRef.current.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      const text = (row as HTMLElement).innerText.toLowerCase();
      (row as HTMLElement).style.display = text.includes(search.toLowerCase()) ? '' : 'none';
    });
  }, [search]);

  return (
    <div>
      <div className="eden-search">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="eden-card" ref={containerRef}>
        {children}
      </div>
    </div>
  );
}
