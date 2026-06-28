'use client';

import { useState, useEffect } from 'react';

interface Popup {
  id: number;
  image_file_id: number;
  link_url: string;
}

export function PopupModal() {
  const [popups, setPopups] = useState<Popup[]>([]);

  useEffect(() => {
    fetch('/api/site/popup')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.popups)) return;
        // 팝업별 "일주일 동안 보지 않기": 저장된 만료 시각(ms) 전까지 숨김
        const now = Date.now();
        const visible: Popup[] = data.popups.filter((p: Popup) => {
          const until = Number(localStorage.getItem(`popup_dismissed_${p.id}`));
          return !(Number.isFinite(until) && until > now);
        });
        setPopups(visible);
      })
      .catch(() => {});
  }, []);

  if (popups.length === 0) return null;

  const close = (id: number) => setPopups((prev) => prev.filter((p) => p.id !== id));

  const dismissForWeek = (id: number) => {
    const until = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7일
    localStorage.setItem(`popup_dismissed_${id}`, String(until));
    close(id);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)' }}
      onClick={() => setPopups([])}
    >
      {popups.map((p, i) => (
        <div
          key={p.id}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${i * 28}px), calc(-50% + ${i * 28}px))`,
            background: '#fff',
            borderRadius: 12,
            overflow: 'hidden',
            width: '90%',
            maxWidth: 420,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          <img
            src={`/api/file/image/${p.image_file_id}`}
            alt="팝업"
            style={{ width: '100%', display: 'block', cursor: p.link_url ? 'pointer' : 'default' }}
            onClick={() => p.link_url && window.open(p.link_url, '_blank')}
          />
          <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={() => dismissForWeek(p.id)}
              style={{ flex: 1, padding: 12, border: 'none', background: 'none', fontSize: 14, color: '#64748b', cursor: 'pointer', borderRight: '1px solid #e2e8f0' }}
            >
              일주일 동안 보지 않기
            </button>
            <button
              onClick={() => close(p.id)}
              style={{ flex: 1, padding: 12, border: 'none', background: 'none', fontSize: 14, color: '#1e293b', fontWeight: 600, cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
