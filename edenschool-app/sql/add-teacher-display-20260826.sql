-- ================================================
-- 수업안내(/class-info) 선생님 추가 — 2026-08-26
--  1) 초등부: 백지원 선생님 (민지연 선생님 다음)
--  2) 컨텐츠 기획(신규 파트): 서효정 대표원장, 조성모 선생님
--
-- 사진 파일은 코드와 함께 배포됨:
--   apps/root/public/assets/teachers/백지원.jpg
--   apps/root/public/assets/teachers/조성모.jpg
-- ⚠️ 배포(pnpm build) 후에 실행할 것. 먼저 실행해도 사진만 안 보일 뿐 문제는 없음.
-- ================================================

-- ─────────── [확인] 실행 전 현재 상태 ───────────
SELECT id, section, name, role, photo_url, sort_order, is_active
  FROM teacher_display
 WHERE section IN ('ELEMENTARY', 'STAFF', 'CONTENT_PLAN')
 ORDER BY section, sort_order;
-- 초등부 sort_order 마지막 값이 3(민지연)인지 확인. 다르면 아래 INSERT의 sort_order를 맞게 수정.

-- ─────────── [적용] ───────────
START TRANSACTION;

-- 1) 초등부 — 백지원 선생님 (이미 있으면 건너뜀)
INSERT INTO teacher_display (section, name, photo_url, sort_order, is_active)
SELECT 'ELEMENTARY', '백지원 선생님', '/assets/teachers/백지원.jpg', 4, 1
  FROM DUAL
 WHERE NOT EXISTS (
   SELECT 1 FROM (SELECT * FROM teacher_display) t
    WHERE t.section = 'ELEMENTARY' AND t.name = '백지원 선생님'
 );

-- 2) 컨텐츠 기획 — 서효정 대표원장
INSERT INTO teacher_display (section, name, role, photo_url, sort_order, is_active)
SELECT 'CONTENT_PLAN', '서효정', '대표원장', '/assets/teachers/서효정.jpg', 1, 1
  FROM DUAL
 WHERE NOT EXISTS (
   SELECT 1 FROM (SELECT * FROM teacher_display) t
    WHERE t.section = 'CONTENT_PLAN' AND t.name = '서효정'
 );

-- 3) 컨텐츠 기획 — 조성모 선생님
INSERT INTO teacher_display (section, name, role, photo_url, sort_order, is_active)
SELECT 'CONTENT_PLAN', '조성모', '선생님', '/assets/teachers/조성모.jpg', 2, 1
  FROM DUAL
 WHERE NOT EXISTS (
   SELECT 1 FROM (SELECT * FROM teacher_display) t
    WHERE t.section = 'CONTENT_PLAN' AND t.name = '조성모'
 );

-- 결과 확인 후 COMMIT, 이상하면 ROLLBACK
COMMIT;

-- ─────────── [확인] 실행 후 ───────────
SELECT id, section, name, role, photo_url, sort_order, is_active
  FROM teacher_display
 WHERE section IN ('ELEMENTARY', 'CONTENT_PLAN')
 ORDER BY section, sort_order;
-- 기대: ELEMENTARY 4건(서미정·강지하·민지연·백지원), CONTENT_PLAN 2건(서효정·조성모)

-- ─────────── [롤백이 필요하면] ───────────
-- DELETE FROM teacher_display WHERE section='CONTENT_PLAN';
-- DELETE FROM teacher_display WHERE section='ELEMENTARY' AND name='백지원 선생님';
