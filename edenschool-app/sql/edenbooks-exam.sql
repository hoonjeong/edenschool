-- 독서교육원 입학 테스트(문해력 진단 평가) 테이블 생성
-- 대상 DB: edenbooks (운영 edenschool DB 아님)
-- 적용: 서버에서 1회 수동 실행. 기존 데이터에 영향 없음(무중단, 순수 신규 테이블).
-- Prisma schema.prisma의 Exam / ExamItem / ExamResult 모델과 컬럼명(camelCase) 일치.

-- 시험지: 종류(ESEO 이서 / IROOM 이룸 / EDEN 이든) + 회차
CREATE TABLE IF NOT EXISTS `Exam` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `type`      VARCHAR(191) NOT NULL,                   -- ESEO | IROOM | EDEN
  `round`     INT          NOT NULL,                   -- 회차
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Exam_type_round_key` (`type`, `round`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 문항 정보(정답·배점·영역·독해능력·설명)
CREATE TABLE IF NOT EXISTS `ExamItem` (
  `id`      INT          NOT NULL AUTO_INCREMENT,
  `examId`  INT          NOT NULL,
  `no`      INT          NOT NULL,                     -- 문항 번호 1~30
  `answer`  INT          NOT NULL,                     -- 정답 1~5
  `score`   INT          NOT NULL,                     -- 배점
  `area`    VARCHAR(191) NOT NULL,                     -- 영역
  `ability` VARCHAR(191) NULL,                         -- 독해능력
  `note`    TEXT         NULL,                         -- 문항 설명
  PRIMARY KEY (`id`),
  UNIQUE KEY `ExamItem_examId_no_key` (`examId`, `no`),
  CONSTRAINT `ExamItem_examId_fkey`
    FOREIGN KEY (`examId`) REFERENCES `Exam` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 응시 결과 (학생 답은 문항 순서대로 JSON 배열로 저장: [3,1,null,...])
CREATE TABLE IF NOT EXISTS `ExamResult` (
  `id`         INT         NOT NULL AUTO_INCREMENT,
  `examId`     INT         NOT NULL,
  `studentId`  INT         NOT NULL,
  `takenAt`    DATE        NOT NULL,                   -- 응시일
  `answers`    TEXT        NOT NULL,                   -- 학생 답 JSON 배열
  `totalScore` INT         NOT NULL DEFAULT 0,         -- 채점 결과(캐시)
  `comment`    TEXT        NULL,                       -- 종합의견
  `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ExamResult_examId_studentId_key` (`examId`, `studentId`),
  KEY `ExamResult_studentId_idx` (`studentId`),
  CONSTRAINT `ExamResult_examId_fkey`
    FOREIGN KEY (`examId`) REFERENCES `Exam` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ExamResult_studentId_fkey`
    FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 롤백:
-- DROP TABLE IF EXISTS `ExamResult`;
-- DROP TABLE IF EXISTS `ExamItem`;
-- DROP TABLE IF EXISTS `Exam`;
