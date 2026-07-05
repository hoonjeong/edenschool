-- ============================================================
-- 학생 세부정보: 메모 / 성적(내신·모의고사) 관리 테이블
-- 적용: 운영 DB에 실행 (배포 전 선반영)
--   * 메모      : student_memo
--   * 성적(공용): student_score  (category = 'naesin' | 'mock')
-- ============================================================

-- ── 1. 학생 메모 ─────────────────────────────
CREATE TABLE IF NOT EXISTS student_memo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  content TEXT NOT NULL,
  insert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_student_memo_student ON student_memo(student_id, insert_time);


-- ── 2. 학생 성적 (내신 + 모의고사 공용) ─────────────────────────────
--   category : 'naesin'(내신) / 'mock'(모의고사)
--   test_name: 내신시험명 / 모의고사명
--   raw_score: 원점수 (0~100)
--   grade_rank: 등급 (1~9)
CREATE TABLE IF NOT EXISTS student_score (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  category VARCHAR(10) NOT NULL DEFAULT 'naesin',
  test_name VARCHAR(200) NOT NULL DEFAULT '',
  raw_score DECIMAL(5,2) DEFAULT NULL,
  grade_rank TINYINT DEFAULT NULL,
  memo TEXT,
  insert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_student_score_lookup ON student_score(student_id, category, insert_time);
