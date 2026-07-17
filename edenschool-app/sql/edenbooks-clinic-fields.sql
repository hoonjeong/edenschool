-- 독서교육원 클리닉 시간표: 담당 선생님·끝나는 시간·진도·특이사항(비고) 컬럼 추가
-- 대상 DB: edenbooks (운영 edenschool DB 아님)
-- 적용: 서버에서 1회 수동 실행. 기존 행은 모두 NULL 허용이라 안전(무중단).
-- Prisma schema.prisma의 Clinic 모델과 컬럼명(camelCase) 일치.

ALTER TABLE `Clinic`
  ADD COLUMN `endTime`  VARCHAR(191) NULL AFTER `time`,
  ADD COLUMN `teacher`  VARCHAR(191) NULL AFTER `subject`,
  ADD COLUMN `progress` VARCHAR(191) NULL AFTER `teacher`,
  ADD COLUMN `note`     TEXT         NULL AFTER `progress`;

-- 롤백:
-- ALTER TABLE `Clinic`
--   DROP COLUMN `endTime`, DROP COLUMN `teacher`, DROP COLUMN `progress`, DROP COLUMN `note`;
