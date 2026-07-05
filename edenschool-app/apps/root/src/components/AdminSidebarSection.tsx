'use client';

import { useState, useEffect } from 'react';

interface Props {
  title: string;
  /** 저장된 값이 없을 때(최초)의 접힘 여부 */
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

/**
 * 사이드바 섹션 접기/펼치기.
 * - 헤더 클릭으로 토글
 * - 상태는 localStorage에 저장되어 재접속 시에도 유지
 * - 저장값이 없으면 defaultCollapsed 사용(원장 로그인 시 '선생님' 섹션만 접힘)
 */
export default function AdminSidebarSection({ title, defaultCollapsed = false, children }: Props) {
  const storageKey = `admin-sidebar-collapsed:${title}`;
  // SSR/최초 클라이언트 렌더가 일치하도록 초기값은 defaultCollapsed
  const [collapsed, setCollapsed] = useState<boolean>(defaultCollapsed);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) setCollapsed(saved === '1');
  }, [storageKey]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, next ? '1' : '0');
      return next;
    });
  };

  return (
    <>
      <div
        className="admin-sidebar-section admin-sidebar-section-toggle"
        onClick={toggle}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{title}</span>
        <i
          className={`fas fa-chevron-${collapsed ? 'right' : 'down'}`}
          style={{ fontSize: '0.7em', opacity: 0.7 }}
        ></i>
      </div>
      {!collapsed && children}
    </>
  );
}
