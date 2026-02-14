'use client';

import Link from 'next/link';
import SmsComposer from '@/components/SmsComposer';

export default function TeacherSmsPage() {
  return (
    <div>
      <div className="admin-sub-nav">
        <Link href="/admin/student-manage">담당반 정보</Link>
        <Link href="/admin/teacher-sms" className="active">문자발송</Link>
      </div>
      <SmsComposer mode="teacher" />
    </div>
  );
}
