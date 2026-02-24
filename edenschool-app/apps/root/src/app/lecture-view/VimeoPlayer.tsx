'use client';

import { useEffect, useRef, useCallback } from 'react';
import Player from '@vimeo/player';

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
      window.removeEventListener('beforeunload', handleBeforeUnload);
      player.destroy().catch(() => {});
    };
  }, [url, initialSeconds, saveProgress, startViewLog, updateViewLog, endViewLog]);

  return <div ref={containerRef} />;
}
