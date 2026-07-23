-- 독서교육원 클리닉 주차별 진도 테이블(ClinicProgress) 생성
-- 대상 DB: edenbooks (운영 edenschool DB 아님)
-- 적용: 서버에서 1회 수동 실행. 기존 Clinic 데이터에 영향 없음(무중단).
-- Prisma schema.prisma의 ClinicProgress 모델과 컬럼명(camelCase) 일치.
-- 월 구분 없는 1~4주차 순환. (clinicId, week) 유일. 클리닉 삭제 시 FK CASCADE로 동반 삭제.

CREATE TABLE IF NOT EXISTS `ClinicProgress` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `clinicId`  INT          NOT NULL,
  `week`      INT          NOT NULL,
  `content`   TEXT         NULL,
  `updatedAt` DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ClinicProgress_clinicId_week_key` (`clinicId`, `week`),
  KEY `ClinicProgress_clinicId_idx` (`clinicId`),
  CONSTRAINT `ClinicProgress_clinicId_fkey`
    FOREIGN KEY (`clinicId`) REFERENCES `Clinic` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (선택) 기존 단일 진도(Clinic.progress) 값을 1주차로 이관하려면 아래 주석 해제:
-- INSERT INTO `ClinicProgress` (`clinicId`, `week`, `content`, `updatedAt`)
-- SELECT `id`, 1, `progress`, NOW(3)
--   FROM `Clinic`
--  WHERE `progress` IS NOT NULL AND `progress` <> '';

-- 롤백:
-- DROP TABLE IF EXISTS `ClinicProgress`;
