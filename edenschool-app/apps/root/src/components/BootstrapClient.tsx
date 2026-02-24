'use client';

import { useEffect } from 'react';

export function BootstrapClient() {
  useEffect(() => {
    // Load Bootstrap JS on the client side
    import('bootstrap/dist/js/bootstrap.bundle.min.js' as any);

    // 모바일 메뉴 토글
    function handleClick(e: MouseEvent) {
      const toggle = (e.target as HTMLElement).closest('[data-toggle="eden-mobile"]');
      if (toggle) {
        const menu = document.getElementById('edenMobileMenu');
        if (menu) menu.classList.toggle('show');
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  return null;
}
