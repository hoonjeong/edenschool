-- 독서교육원 보강 수업 테이블(MakeupClass) 생성
-- 대상 DB: edenbooks (운영 edenschool DB 아님)
-- 적용: 서버에서 1회 수동 실행. 기존 데이터에 영향 없음(무중단, 순수 신규 테이블).
-- Prisma schema.prisma의 MakeupClass 모델과 컬럼명(camelCase) 일치.
-- 학생 삭제 시 FK CASCADE로 동반 삭제.

CREATE TABLE IF NOT EXISTS `MakeupClass` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `studentId`   INT          NOT NULL,
  `absentDate`  DATE         NOT NULL,                 -- 결석일
  `makeupDate`  DATE         NOT NULL,                 -- 보강일
  `weekday`     INT          NOT NULL,                 -- 보강요일 0=일 ... 6=토
  `time`        VARCHAR(191) NULL,                     -- 시간
  `attended`    VARCHAR(191) NULL,                     -- 출석여부
  `session`     VARCHAR(191) NULL,                     -- 보강 차시
  `progress`    TEXT         NULL,                      -- 진도 외
  `teacher`     VARCHAR(191) NULL,                     -- 보강 담당T
  `teacherNote` VARCHAR(191) NULL,                     -- 보강 담당T 의견
  `note`        VARCHAR(191) NULL,                     -- 비고
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `MakeupClass_studentId_idx` (`studentId`),
  KEY `MakeupClass_makeupDate_idx` (`makeupDate`),
  CONSTRAINT `MakeupClass_studentId_fkey`
    FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 롤백:
-- DROP TABLE IF EXISTS `MakeupClass`;
