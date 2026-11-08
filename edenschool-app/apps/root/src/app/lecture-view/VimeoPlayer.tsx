'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Player from '@vimeo/player';

/** 이 시간 안에 플레이어가 준비되지 않으면 차단된 것으로 보고 안내를 띄운다 */
const READY_TIMEOUT_MS = 15000;

interface Props {
  url: string;
  initialSeconds: number;
  lectureId: number;
}

export default function VimeoPlayer({ url, initialSeconds, lectureId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const lastSaveRef = useRef(0);
  const progressRef = useRef({ watchedSeconds: 0, duration: 0, percent: 0 });
  const viewLogIdRef = useRef<number | null>(null);
  const viewLogStartRef = useRef(0);
  const [loadFailed, setLoadFailed] = useState(false);

  const saveProgress = useCallback(async (completed: boolean = false) => {
    const p = progressRef.current;
    if (p.duration <= 0) return;

    try {
      await fetch('/api/lecture/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureId,
          watchedSeconds: Math.floor(p.watchedSeconds),
          duration: Math.floor(p.duration),
          percent: Math.min(Math.round(p.percent * 100) / 100, 100),
          completed: completed ? 1 : 0,
        }),
      });
    } catch {
      // 네트워크 오류 무시
    }
  }, [lectureId]);

  const startViewLog = useCallback(async (seconds: number) => {
    if (viewLogIdRef.current) return;
    viewLogStartRef.current = seconds;
    try {
      const res = await fetch('/api/lecture/view-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId, startSeconds: Math.floor(seconds) }),
      });
      const data = await res.json();
      if (data.id) {
        viewLogIdRef.current = data.id;
      }
    } catch {
      // 네트워크 오류 무시
    }
  }, [lectureId]);

  const updateViewLog = useCallback(async () => {
    const id = viewLogIdRef.current;
    if (!id) return;
    const p = progressRef.current;
    const endSeconds = Math.floor(p.watchedSeconds);
    const duration = Math.max(0, endSeconds - Math.floor(viewLogStartRef.current));
    try {
      await fetch('/api/lecture/view-log', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, endSeconds, duration }),
      });
    } catch {
      // 네트워크 오류 무시
    }
  }, []);

  const endViewLog = useCallback(async () => {
    await updateViewLog();
    viewLogIdRef.current = null;
  }, [updateViewLog]);

  useEffect(() => {
    if (!containerRef.current) return;

    const player = new Player(containerRef.current, {
      url: url as any,
      responsive: true,
    });

    playerRef.current = player;

    // 스크린 타임·차단 앱 등으로 vimeo.com 이 막히면 빈 화면만 남는다 → 안내 표시
    let ready = false;
    const readyTimer = window.setTimeout(() => {
      if (!ready) setLoadFailed(true);
    }, READY_TIMEOUT_MS);
    player.ready().then(
      () => {
        ready = true;
        window.clearTimeout(readyTimer);
        setLoadFailed(false);
      },
      () => {
        window.clearTimeout(readyTimer);
        setLoadFailed(true);
      }
    );

    player.on('loaded', () => {
      if (initialSeconds > 0) {
        player.setCurrentTime(initialSeconds).catch(() => {});
      }
    });

    player.on('play', (data: { seconds: number }) => {
      startViewLog(data.seconds);
    });

    player.on('timeupdate', (data: { seconds: number; duration: number; percent: number }) => {
      progressRef.current = {
        watchedSeconds: data.seconds,
        duration: data.duration,
        percent: data.percent * 100,
      };

      // 10초마다 저장
      const now = Date.now();
      if (now - lastSaveRef.current > 10000) {
        lastSaveRef.current = now;
        saveProgress(false);
        updateViewLog();
      }

      // 프로그레스 바 업데이트
      const fill = document.getElementById('eden-progress-fill');
      if (fill) {
        fill.style.width = `${data.percent * 100}%`;
      }
    });

    player.on('pause', () => {
      endViewLog();
    });

    player.on('ended', () => {
      progressRef.current.percent = 100;
      saveProgress(true);
      endViewLog();
    });

    // 페이지 이탈 시 저장
    const handleBeforeUnload = () => {
      saveProgress(false);
      // sendBeacon으로 시청 로그 종료
      const id = viewLogIdRef.current;
      if (id) {
        const p = progressRef.current;
        const endSeconds = Math.floor(p.watchedSeconds);
        const duration = Math.max(0, endSeconds - Math.floor(viewLogStartRef.current));
        navigator.sendBeacon(
          '/api/lecture/view-log',
          new Blob(
            [JSON.stringify({ _method: 'PUT', id, endSeconds, duration })],
            { type: 'application/json' }
          )
        );
        viewLogIdRef.current = null;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.clearTimeout(readyTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      player.destroy().catch(() => {});
    };
  }, [url, initialSeconds, saveProgress, startViewLog, updateViewLog, endViewLog]);

  return (
    <>
      <div ref={containerRef} />
      {loadFailed && (
        <div
          role="alert"
          style={{
            padding: '28px 20px',
            borderRadius: 10,
            background: '#1e293b',
            color: '#e2e8f0',
            fontSize: 14,
            lineHeight: 1.7,
            textAlign: 'center',
          }}
        >
          <i className="fas fa-exclamation-circle" style={{ fontSize: 28, color: '#fbbf24', marginBottom: 10 }} />
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>영상을 불러올 수 없습니다.</div>
          <div>
            휴대폰의 <b>스크린 타임(웹 콘텐츠 제한)</b>, 유해사이트 차단 앱, VPN 설정에서
            <br />
            <b>vimeo.com</b> 접속이 막혀 있는지 확인해 주세요.
          </div>
          <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>
            계속 안 되면 다른 기기(PC 등)로 시청하거나 선생님께 문의해 주세요.
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="eden-btn eden-btn-secondary"
            style={{ marginTop: 14 }}
          >
            <i className="fas fa-redo" /> 다시 시도
          </button>
        </div>
      )}
    </>
  );
}
