-- ============================================================
-- 모의고사 기출 테이블 (내신 기출과 별개)
--  1) 풀세트 모의고사: 학년 / 년도 / 시행월
--  2) 영역별       : 대영역 / 세부영역 / 학년 / 년도 / 시행월 / 검색키워드
-- 적용: 운영 DB에 실행 (배포/임포트 전 선반영)
-- ============================================================

-- ── 1. 풀세트 모의고사 ─────────────────────────────
CREATE TABLE IF NOT EXISTS mock_full_meta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grade VARCHAR(10) DEFAULT '',        -- 고1 / 고2 / 고3
  year INT DEFAULT 0,                  -- 시행 연도 (2010~)
  month TINYINT DEFAULT 0,             -- 시행월 (3/6/9/11 등)
  file_type VARCHAR(10) DEFAULT 'HWP', -- HWP / HWPX / PDF
  insert_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mock_full_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meta_id INT NOT NULL,
  file_name VARCHAR(500) DEFAULT '',
  content LONGBLOB,
  insert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meta_id) REFERENCES mock_full_meta(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 검색 필터(학년/년도/시행월) 최적화 인덱스
CREATE INDEX idx_mock_full_filter ON mock_full_meta(grade, year, month);
CREATE INDEX idx_mock_full_year   ON mock_full_meta(year);
CREATE INDEX idx_mock_full_content_meta ON mock_full_content(meta_id);


-- ── 2. 영역별 모의고사 ─────────────────────────────
CREATE TABLE IF NOT EXISTS mock_section_meta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area VARCHAR(30) DEFAULT '',         -- 대영역: 화법/작문/화법작문통합/문법/문학/독서/매체
  sub_area VARCHAR(30) DEFAULT '',     -- 세부영역: 현대시/고전소설/고전시가/극문학/현대소설 등 (주로 문학)
  grade VARCHAR(10) DEFAULT '',        -- 고1 / 고2 / 고3
  year INT DEFAULT 0,                  -- 시행 연도
  month TINYINT DEFAULT 0,             -- 시행월
  search_keyword VARCHAR(500) DEFAULT '', -- 파일명 '[' 앞의 작품/주제 텍스트
  file_type VARCHAR(10) DEFAULT 'HWP',
  insert_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mock_section_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meta_id INT NOT NULL,
  file_name VARCHAR(500) DEFAULT '',
  content LONGBLOB,
  insert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meta_id) REFERENCES mock_section_meta(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 검색 필터(영역/세부영역/학년/년도/시행월) 최적화 인덱스
CREATE INDEX idx_mock_section_filter  ON mock_section_meta(area, sub_area, grade, year, month);
CREATE INDEX idx_mock_section_area    ON mock_section_meta(area);
CREATE INDEX idx_mock_section_grade   ON mock_section_meta(grade);
CREATE INDEX idx_mock_section_year    ON mock_section_meta(year);
CREATE INDEX idx_mock_section_keyword ON mock_section_meta(search_keyword(100));
CREATE INDEX idx_mock_section_content_meta ON mock_section_content(meta_id);
