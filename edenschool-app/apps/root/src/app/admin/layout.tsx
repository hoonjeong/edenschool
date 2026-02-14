import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopbar } from '@/components/AdminTopbar';
import { AdminOverlay } from '@/components/AdminOverlay';
import './admin.css';

export const metadata: Metadata = {
  title: '이든배움국어학원 관리시스템',
  description: '이든배움국어학원 관리자 시스템',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <AdminOverlay />
      <div className="admin-main">
        <AdminTopbar />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
