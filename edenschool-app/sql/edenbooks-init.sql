-- ============================================================
-- 이든 독서교육원(edenbooks) 초기 스키마
-- 대상: edenschool 운영 서버의 MariaDB/MySQL 에 "별도 데이터베이스"로 생성
-- 적용: 서버에서 이 스크립트를 1회 실행 (운영 edenschool DB와 분리됨)
-- 근거: edenbooks_manager/prisma/migrations 를 하나로 통합 + 이후 ALTER 반영
--
-- ⚠️ 운영 DB(edenschool)는 건드리지 않습니다. 아래는 새 스키마 edenbooks 를 만듭니다.
--    런타임 연결은 앱의 EDENBOOKS_DB_* 환경변수를 통해 이 DB를 바라봅니다.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `edenbooks`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `edenbooks`;

-- ── 사용자(선생님/원장) ────────────────────────────────
CREATE TABLE IF NOT EXISTS `User` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN', 'TEACHER', 'CLINIC') NOT NULL DEFAULT 'TEACHER',
  `active` BOOLEAN NOT NULL DEFAULT true,
  `passwordHash` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `User_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 반 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Class` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `schedule` VARCHAR(191) NULL,
  `capacity` INTEGER NOT NULL DEFAULT 8,
  `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
  `teacherId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 학생 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Student` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `grade` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `phoneLast4` VARCHAR(191) NOT NULL,
  `status` ENUM('ENROLLED', 'PAUSED', 'WITHDRAWN') NOT NULL DEFAULT 'ENROLLED',
  `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `memo` TEXT NULL,
  `classId` INTEGER NULL,
  INDEX `Student_phoneLast4_idx`(`phoneLast4`),
  INDEX `Student_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 출결 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Attendance` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `studentId` INTEGER NOT NULL,
  `date` DATE NOT NULL,
  `checkInAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'MAKEUP') NOT NULL DEFAULT 'PRESENT',
  `method` ENUM('KEYPAD', 'MANUAL') NOT NULL DEFAULT 'KEYPAD',
  `note` VARCHAR(191) NULL,
  INDEX `Attendance_date_idx`(`date`),
  UNIQUE INDEX `Attendance_studentId_date_key`(`studentId`, `date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 관찰일지 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Observation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `studentId` INTEGER NOT NULL,
  `round` INTEGER NOT NULL,
  `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `items` JSON NOT NULL,
  `memo` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Observation_studentId_idx`(`studentId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 상담 기록 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Counsel` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `studentId` INTEGER NOT NULL,
  `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `type` VARCHAR(191) NOT NULL DEFAULT '정기상담',
  `content` TEXT NOT NULL,
  `nextAction` TEXT NULL,
  `nextDate` DATETIME(3) NULL,
  `observationId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Counsel_studentId_idx`(`studentId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── AI 서술형 첨삭 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Correction` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `studentId` INTEGER NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT '첨삭',
  `imageUrl` VARCHAR(191) NULL,
  `problemText` TEXT NULL,
  `answerText` TEXT NULL,
  `genre` VARCHAR(191) NULL,
  `gradeLevel` VARCHAR(191) NULL,
  `options` JSON NULL,
  `scores` JSON NULL,
  `resultText` TEXT NULL,
  `summary` TEXT NULL,
  `status` ENUM('UPLOADED', 'RECOGNIZED', 'DONE') NOT NULL DEFAULT 'UPLOADED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Correction_studentId_idx`(`studentId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 공지 템플릿 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `NoticeTemplate` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `variables` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 앱 설정 (key-value) ────────────────────────────────
CREATE TABLE IF NOT EXISTS `AppSetting` (
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 클리닉 시간표 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `Clinic` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `studentId` INTEGER NOT NULL,
  `weekday` INTEGER NOT NULL,
  `time` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL DEFAULT '클리닉',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Clinic_weekday_idx`(`weekday`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 문자 발송 로그 (알리고) ─────────────────────────────
CREATE TABLE IF NOT EXISTS `SmsLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `sendId` INTEGER NOT NULL DEFAULT 0,
  `phone` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'SMS',
  `title` VARCHAR(191) NULL,
  `resultMessage` TEXT NULL,
  `success` BOOLEAN NOT NULL DEFAULT false,
  `templateId` INTEGER NULL,
  `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `SmsLog_sentAt_idx`(`sentAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── 외래키 제약 ────────────────────────────────────────
ALTER TABLE `Class` ADD CONSTRAINT `Class_teacherId_fkey`
  FOREIGN KEY (`teacherId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Student` ADD CONSTRAINT `Student_classId_fkey`
  FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Observation` ADD CONSTRAINT `Observation_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Counsel` ADD CONSTRAINT `Counsel_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Counsel` ADD CONSTRAINT `Counsel_observationId_fkey`
  FOREIGN KEY (`observationId`) REFERENCES `Observation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Correction` ADD CONSTRAINT `Correction_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Clinic` ADD CONSTRAINT `Clinic_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- (선택) 초기 스태프 시드 — 반 담당(teacher) 배정용.
-- 로그인 자체는 edenschool R 계정으로 하므로 필수는 아님.
-- INSERT INTO `User` (`name`, `email`, `role`, `active`) VALUES
--   ('원장', 'admin@edenbooks.kr', 'ADMIN', true);
-- ============================================================
