'use client';

import Link from 'next/link';

const MENU_ITEMS = [
  { label: '담당반 정보', href: '/admin/student-manage', icon: 'bi-people' },
  { label: '문자발송', href: '/admin/teacher-sms', icon: 'bi-chat-dots' },
  { label: '내영상 보기', href: '/admin/teacher-lecture', icon: 'bi-camera-video' },
  { label: '공지사항', href: '/admin/post', icon: 'bi-megaphone' },
];

export default function DashboardClient() {
  return (
    <div>
      {/* Management Menu */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">관리 메뉴</h5>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {MENU_ITEMS.map((item) => (
                  <div key={item.href} className="col-6 col-md-3">
                    <Link
                      href={item.href}
                      className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 py-3"
                    >
                      <i className={`bi ${item.icon}`}></i>
                      {item.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
