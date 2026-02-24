'use client';

import { useState, useEffect } from 'react';

export function PopupModal() {
  const [popup, setPopup] = useState<{
    image_file_id: number;
    link_url: string;
  } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // "오늘 다시 보지 않기" 체크
    const dismissed = localStorage.getItem('popup_dismissed');
    if (dismissed) {
      const today = new Date().toISOString().slice(0, 10);
      if (dismissed === today) return;
    }

    fetch('/api/site/popup')
      .then((r) => r.json())
      .then((data) => {
        if (data.popup && data.popup.image_file_id) {
          setPopup(data.popup);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!visible || !popup) return null;

  const handleClose = () => setVisible(false);

  const handleDismissToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('popup_dismissed', today);
    setVisible(false);
  };

  const handleImageClick = () => {
    if (popup.link_url) {
      window.open(popup.link_url, '_blank');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          maxWidth: 480,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`/api/file/image/${popup.image_file_id}`}
          alt="팝업"
          style={{ width: '100%', display: 'block', cursor: popup.link_url ? 'pointer' : 'default' }}
          onClick={handleImageClick}
        />
        <div style={{ display: 'flex', borderTop: '1px solid #e2e8f0' }}>
          <button
            onClick={handleDismissToday}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              fontSize: 14,
              color: '#64748b',
              cursor: 'pointer',
              borderRight: '1px solid #e2e8f0',
            }}
          >
            오늘 다시 보지 않기
          </button>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: 'none',
              fontSize: 14,
              color: '#1e293b',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
