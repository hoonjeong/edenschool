-- 강의 질문(question)에 선생님 답변 기능 추가
-- 질문당 답변 1개: 답변 내용/답변자 이름/답변 시각 컬럼 추가
-- 적용: 운영 DB에 아래 ALTER를 실행 (배포 전 선반영 권장)

ALTER TABLE question
  ADD COLUMN answer TEXT NULL AFTER text,
  ADD COLUMN answer_by VARCHAR(50) NULL AFTER answer,
  ADD COLUMN answer_time DATETIME NULL AFTER answer_by;
