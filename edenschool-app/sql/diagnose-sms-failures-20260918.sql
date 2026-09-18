-- ─────────────────────────────────────────────────────────────
-- 문자 발송 실패 피해규모 조사 (2026-09-18)
--
-- 배경: 발신번호가 알리고에 미등록이면 알리고가 발송을 거절하는데,
--       화면에는 "발송 완료"로 표시돼 실패를 아무도 몰랐다.
--       sms_send_result_renew.result_message 에 알리고 응답 원문이,
--       send_id 에 발송한 관리자 id 가 남아 있어 지난 실패를 전부 추적할 수 있다.
--
-- 전부 SELECT 이므로 데이터를 바꾸지 않는다.
--
-- ※ 성공 판정은 JSON 함수 대신 정규식으로 한다.
--   알리고가 JSON 이 아닌 응답(HTML 에러 등)을 준 행이 섞여 있으면
--   JSON_EXTRACT 는 쿼리 전체를 에러로 중단시키기 때문이다.
--   성공 = "result_code" 값이 1 이상  /  실패 = 음수·0·비JSON·NULL 전부
-- ─────────────────────────────────────────────────────────────


-- ── 1. 월별 성공/실패 추이 ── 언제부터 터졌는지
SELECT
  date_format(send_time, '%Y-%m')                                        AS 월,
  COUNT(*)                                                               AS 총건수,
  SUM(result_message REGEXP '"result_code"[[:space:]]*:[[:space:]]*"?[1-9]')      AS 성공,
  SUM(COALESCE(result_message REGEXP '"result_code"[[:space:]]*:[[:space:]]*"?[1-9]', 0) = 0) AS 실패
FROM sms_send_result_renew
GROUP BY 월
ORDER BY 월 DESC
LIMIT 24;


-- ── 2. 발송자별 실패 현황 ── 어느 선생님 문자가 안 나갔는지
SELECT
  COALESCE(a.name, CONCAT('(id=', s.send_id, ')'))                       AS 발송자,
  p.aca_phone                                                            AS 발신번호,
  COUNT(*)                                                               AS 총건수,
  SUM(s.result_message REGEXP '"result_code"[[:space:]]*:[[:space:]]*"?[1-9]')    AS 성공,
  SUM(COALESCE(s.result_message REGEXP '"result_code"[[:space:]]*:[[:space:]]*"?[1-9]', 0) = 0) AS 실패,
  MIN(s.send_time)                                                       AS 첫발송,
  MAX(s.send_time)                                                       AS 마지막발송
FROM sms_send_result_renew s
LEFT JOIN admin_user_info a ON a.id = s.send_id
LEFT JOIN aca_part        p ON p.teacher_id = s.send_id
GROUP BY s.send_id, a.name, p.aca_phone
ORDER BY 실패 DESC;


-- ── 3. 실패 사유별 집계 ── 발신번호 미등록이 맞는지 확인
SELECT
  LEFT(result_message, 120)                                              AS 응답원문,
  COUNT(*)                                                               AS 건수,
  MIN(send_time)                                                         AS 처음,
  MAX(send_time)                                                         AS 마지막
FROM sms_send_result_renew
WHERE COALESCE(result_message REGEXP '"result_code"[[:space:]]*:[[:space:]]*"?[1-9]', 0) = 0
GROUP BY 응답원문
ORDER BY 건수 DESC;


-- ── 4. 심미숙 선생님 실패분 상세 ── 재발송 대상 명단
SELECT
  s.send_time                                                            AS 발송시각,
  s.phone                                                                AS 수신번호,
  LEFT(s.message, 40)                                                    AS 내용요약,
  LEFT(s.result_message, 80)                                             AS 실패사유
FROM sms_send_result_renew s
JOIN admin_user_info a ON a.id = s.send_id
WHERE a.name LIKE '%심미숙%'
  AND COALESCE(s.result_message REGEXP '"result_code"[[:space:]]*:[[:space:]]*"?[1-9]', 0) = 0
ORDER BY s.send_time DESC;
