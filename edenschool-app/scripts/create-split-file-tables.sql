-- 쪼개기 파일 메타 정보
CREATE TABLE IF NOT EXISTS split_file_meta_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grade VARCHAR(10) DEFAULT '',
  subject VARCHAR(50) DEFAULT '',
  publisher VARCHAR(50) DEFAULT '',
  search_keyword VARCHAR(500) DEFAULT '',
  school_name VARCHAR(100) DEFAULT '',
  year INT DEFAULT 0,
  term TINYINT DEFAULT 0,
  test_type TINYINT DEFAULT 0,
  file_type VARCHAR(10) DEFAULT 'HWP',
  insert_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 쪼개기 파일 바이너리
CREATE TABLE IF NOT EXISTS split_file_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meta_id INT NOT NULL,
  file_name VARCHAR(500) DEFAULT '',
  content LONGBLOB,
  insert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meta_id) REFERENCES split_file_meta_info(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 검색 성능을 위한 인덱스
CREATE INDEX idx_split_file_meta_keyword ON split_file_meta_info(search_keyword(100));
CREATE INDEX idx_split_file_meta_grade ON split_file_meta_info(grade);
CREATE INDEX idx_split_file_meta_subject ON split_file_meta_info(subject);
CREATE INDEX idx_split_file_meta_publisher ON split_file_meta_info(publisher);
CREATE INDEX idx_split_file_content_meta_id ON split_file_content(meta_id);
