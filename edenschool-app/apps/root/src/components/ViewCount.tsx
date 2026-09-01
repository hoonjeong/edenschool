'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 조회수 표시 + 집계 요청.
 *
 * 서버 렌더링 중에 조회수를 올리면 새로고침·프리페치마다 늘어나므로,
 * 화면이 뜬 뒤 브라우저에서 한 번만 집계 API 를 호출한다.
 * 실제 중복 방지(쿠키)는 서버에서 하고, 여기서는 집계된 경우에만 숫자를 1 올려 보여준다.
 *
 * 글이 바뀔 때 다시 집계되도록 부모에서 key={postId} 로 렌더한다.
 */
export function ViewCount({
  endpoint,
  postId,
  initialCount,
}: {
  endpoint: string;
  postId: number;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return; // 개발 모드(StrictMode) 이중 실행 방지
    requested.current = true;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.counted) setCount((c) => c + 1);
      })
      .catch(() => {
        // 집계 실패는 화면에 영향을 주지 않는다
      });
  }, [endpoint, postId]);

  return <>조회 {count}</>;
}
