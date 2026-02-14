'use client';

export function AdminTopbar() {
  const handleToggle = () => {
    document.getElementById('adminSidebar')?.classList.toggle('show');
    document.getElementById('adminOverlay')?.classList.toggle('show');
  };

  return (
    <div className="admin-topbar">
      <button className="admin-topbar-toggle" onClick={handleToggle} aria-label="메뉴 열기">
        <i className="fas fa-bars"></i>
      </button>
      <span className="admin-topbar-title">이든배움 관리자</span>
    </div>
  );
}
