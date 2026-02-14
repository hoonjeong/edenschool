'use client';

export function AdminOverlay() {
  const handleClose = () => {
    document.getElementById('adminSidebar')?.classList.remove('show');
    document.getElementById('adminOverlay')?.classList.remove('show');
  };

  return <div className="admin-overlay" id="adminOverlay" onClick={handleClose} />;
}
