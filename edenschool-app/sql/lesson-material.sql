-- 수업자료생성(/admin/lesson-material) 스키마
--
-- 적용: 운영 DB(edenschool)에 사용자가 직접 실행한다. (코드에서 자동 실행하지 않음)
--   mysql -u <user> -p edenschool < sql/lesson-material.sql
--
-- 주의: 본문(HTML)에 이모지 등 4바이트 문자가 들어올 수 있어 utf8mb4 로 만든다.
--       기존 공용 커넥션 풀(charset=utf8, 3바이트)로는 4바이트 문자 저장 시 오류가 나므로
--       이 기능은 별도 utf8mb4 풀(src/lib/lesson-material/db.ts)을 사용한다.

SET NAMES utf8mb4;

-- 등록된 템플릿
CREATE TABLE IF NOT EXISTS lesson_material_template (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL COMMENT '원본 파일명',
  title       VARCHAR(255) NOT NULL DEFAULT '' COMMENT '템플릿 h1에서 추출한 제목',
  html        LONGTEXT     NOT NULL COMMENT '원본 HTML 전문',
  css         MEDIUMTEXT   NOT NULL COMMENT '추출한 style 내용 (프롬프트용)',
  skeleton    MEDIUMTEXT   NOT NULL COMMENT '#paper 내부 골격 (프롬프트용)',
  guide       TEXT         NULL     COMMENT '템플릿에 포함된 작업 지시 주석',
  has_paper   TINYINT(1)   NOT NULL DEFAULT 1,
  byte_size   INT UNSIGNED NOT NULL DEFAULT 0,
  admin_id    INT UNSIGNED NULL     COMMENT '등록한 관리자(admin_user_info.id)',
  admin_name  VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '등록 당시 이름(표시용 스냅샷)',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lm_template_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 생성 이력
CREATE TABLE IF NOT EXISTS lesson_material_generation (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  template_id   INT UNSIGNED NULL COMMENT '템플릿 삭제 시 NULL (이력은 보존)',
  title         VARCHAR(255) NOT NULL DEFAULT '',
  status        ENUM('running','done','error') NOT NULL DEFAULT 'running',
  extra_prompt  TEXT         NULL COMMENT '사용자 추가 지시',
  body_html     LONGTEXT     NULL COMMENT 'AI가 생성한 #paper 내부 조각',
  full_html     LONGTEXT     NULL COMMENT '템플릿에 삽입한 완성본',
  error         TEXT         NULL,
  stop_reason   VARCHAR(40)  NULL,
  input_tokens  INT UNSIGNED NOT NULL DEFAULT 0,
  output_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  admin_id      INT UNSIGNED NULL     COMMENT '생성한 관리자(admin_user_info.id)',
  admin_name    VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '생성 당시 이름(표시용 스냅샷)',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at   DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_lm_generation_created (created_at),
  KEY idx_lm_generation_template (template_id),
  CONSTRAINT fk_lm_generation_template FOREIGN KEY (template_id)
    REFERENCES lesson_material_template(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 생성에 사용된 첨부 자료 (파일 본체는 업로드 폴더에 보관)
CREATE TABLE IF NOT EXISTS lesson_material_source (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  generation_id INT UNSIGNED NOT NULL,
  filename      VARCHAR(255) NOT NULL,
  stored_name   VARCHAR(255) NOT NULL COMMENT '업로드 폴더 내 저장 파일명',
  mime          VARCHAR(120) NOT NULL DEFAULT '',
  kind          ENUM('pdf','image','text') NOT NULL,
  byte_size     INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_lm_source_generation (generation_id),
  CONSTRAINT fk_lm_source_generation FOREIGN KEY (generation_id)
    REFERENCES lesson_material_generation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
