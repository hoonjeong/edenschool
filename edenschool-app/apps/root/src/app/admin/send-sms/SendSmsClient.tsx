'use client';

import { useState } from 'react';
import SmsComposer, { type RecipientSource } from '@/components/SmsComposer';

// 운영진 전용 문자발송. 발송 대상을 고르는 방식만 탭으로 나뉘고,
// 메시지 작성·발신번호·이력은 SmsComposer 가 공통으로 처리한다.
const TABS: { key: RecipientSource; label: string; icon: string }[] = [
  { key: 'class', label: '반으로 발송', icon: 'fa-users' },
  { key: 'manual', label: '번호로 발송', icon: 'fa-keyboard' },
  { key: 'excel', label: '엑셀로 발송', icon: 'fa-file-excel' },
];

export function SendSmsClient() {
  const [tab, setTab] = useState<RecipientSource>('class');

  return (
    <div>
      <div className="admin-sub-nav">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? 'active' : undefined}
            onClick={() => setTab(t.key)}
          >
            <i className={`fas ${t.icon}`} style={{ marginRight: 6 }}></i>
            {t.label}
          </button>
        ))}
      </div>
      {/* key 를 바꿔 탭 전환 시 입력 상태를 초기화한다 (반 선택분이 엑셀 탭에 남지 않게) */}
      <SmsComposer key={tab} mode="admin" recipients={tab} />
    </div>
  );
}
