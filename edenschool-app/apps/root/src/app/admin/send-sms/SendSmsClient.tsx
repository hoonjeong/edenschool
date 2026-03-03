'use client';

import Link from 'next/link';
import SmsComposer from '@/components/SmsComposer';

export function SendSmsClient() {
  return (
    <div>
      <div className="admin-sub-nav">
        <Link href="/admin/student-manage">담당반 정보</Link>
        <Link href="/admin/send-sms" className="active">문자발송</Link>
      </div>
      <SmsComposer mode="admin" />
    </div>
  );
}
