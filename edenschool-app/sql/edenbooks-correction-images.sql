-- 독서교육원(edenbooks) DB — AI 첨삭 원본 답안 이미지 보관
--
-- 배경: 지금까지 첨삭에 사용한 원본 답안 사진이 어디에도 저장되지 않아,
--       나중에 인식 결과(problemText/answerText)와 원본을 대조할 수 없었다.
--       이미지 파일 자체는 업로드 폴더(upload/reading/corrections/<첨삭ID>/)에 저장하고,
--       DB에는 그 상대경로 배열만 JSON으로 둔다. (BLOB로 넣지 않아 DB가 커지지 않음)
--
-- 적용 대상 DB: edenbooks  (EDENBOOKS_DB_NAME)
-- 실행 시점: 배포 전 1회. 컬럼 추가만 하므로 기존 데이터에 영향 없음.

ALTER TABLE `Correction` ADD COLUMN `images` JSON NULL;

-- (선택) 사용되지 않던 목업 컬럼 정리. 남겨 두어도 동작에는 지장이 없으므로
--        데이터 확인 후 필요할 때만 실행하세요.
-- ALTER TABLE `Correction` DROP COLUMN `imageUrl`;
