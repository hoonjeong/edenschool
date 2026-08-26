-- 오라클 이전 직후 서버 타임존이 UTC라서 KST보다 9시간 이르게 기록된 행 보정
-- 대상: 컷오버(ncloud 정지) 이후 오라클에서 새로 생성된 행만.
--   ncloud MAX(id) 기준 - lecture_progress:2, lecture_view_log:2, session_log:80
-- 판별: 오늘 밤 생성된 행 중 값이 2026-08-26 00:00:00 미만이면 UTC 기록(=+9h 필요).
--       그 이상이면 타임존 수정 후 갱신된 값이라 이미 KST.
-- ⚠️ 적용 전 아래 [확인] 블록을 먼저 실행해 대상 행을 눈으로 볼 것.

-- ─────────── [확인] 적용 전 조회 ───────────
SELECT 'lecture_progress' t, id, created_at, updated_at FROM lecture_progress WHERE id > 2
UNION ALL SELECT 'lecture_view_log', id, start_time, end_time FROM lecture_view_log WHERE id > 2
UNION ALL SELECT 'session_log', id, last_active, NULL FROM session_log WHERE id > 80;

-- ─────────── [적용] ───────────
START TRANSACTION;

UPDATE lecture_progress
   SET created_at = DATE_ADD(created_at, INTERVAL 9 HOUR)
 WHERE id > 2 AND created_at < '2026-08-26 00:00:00';

UPDATE lecture_progress
   SET updated_at = DATE_ADD(updated_at, INTERVAL 9 HOUR)
 WHERE id > 2 AND updated_at < '2026-08-26 00:00:00';

UPDATE lecture_view_log
   SET start_time = DATE_ADD(start_time, INTERVAL 9 HOUR)
 WHERE id > 2 AND start_time < '2026-08-26 00:00:00';

UPDATE lecture_view_log
   SET end_time = DATE_ADD(end_time, INTERVAL 9 HOUR)
 WHERE id > 2 AND end_time IS NOT NULL AND end_time < '2026-08-26 00:00:00';

UPDATE session_log
   SET last_active = DATE_ADD(last_active, INTERVAL 9 HOUR)
 WHERE id > 80 AND last_active < '2026-08-26 00:00:00';

-- 결과 확인 후 COMMIT, 이상하면 ROLLBACK
COMMIT;

-- ─────────── [확인] 적용 후 조회 ───────────
SELECT 'lecture_progress' t, id, created_at, updated_at FROM lecture_progress WHERE id > 2
UNION ALL SELECT 'lecture_view_log', id, start_time, end_time FROM lecture_view_log WHERE id > 2
UNION ALL SELECT 'session_log', id, last_active, NULL FROM session_log WHERE id > 80;
