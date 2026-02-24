'use client';

import { useEffect } from 'react';

export function SessionHeartbeat() {
  useEffect(() => {
    function sendHeartbeat() {
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
    }

    // 첫 전송
    sendHeartbeat();

    // 5분마다 전송
    const interval = setInterval(sendHeartbeat, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
