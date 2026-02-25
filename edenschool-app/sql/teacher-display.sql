-- ================================================
-- teacher_display: 수업안내 페이지 선생님/운영진 데이터
-- ================================================

CREATE TABLE IF NOT EXISTS teacher_display (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section VARCHAR(20) NOT NULL COMMENT 'HIGH_SCHOOL, MIDDLE_SCHOOL, SUNEUNG, ELEMENTARY, STAFF',
  branch VARCHAR(100) DEFAULT NULL COMMENT '관 이름 (예: 이든배움국어상동2관)',
  school VARCHAR(100) DEFAULT NULL COMMENT '학교명 (예: 상원고)',
  name VARCHAR(100) NOT NULL COMMENT '선생님/운영진 이름',
  role VARCHAR(100) DEFAULT NULL COMMENT '운영진 역할 (예: 대표원장)',
  photo_url VARCHAR(500) DEFAULT NULL COMMENT '사진 URL 경로',
  photo_file_id INT DEFAULT NULL COMMENT '업로드된 사진 파일 ID',
  schedule_data TEXT DEFAULT NULL COMMENT 'JSON 시간표 데이터',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section (section),
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 시드 데이터: 현재 수업안내 페이지의 정적 데이터
-- ================================================

-- 고등부
INSERT INTO teacher_display (section, branch, school, name, photo_url, schedule_data, sort_order) VALUES
('HIGH_SCHOOL', '이든배움국어상동2관', '상원고', '김보름 선생님', '/assets/teachers/김보름.jpg',
 '[{"grade":"고1","time":"토 19:00~22:00 / 일 19:00~22:00"},{"grade":"고2","time":"토 10:00~13:00 / 토 16:00~19:00"},{"grade":"고3","time":"일 10:00~13:00 / 일 15:00~18:00"}]', 1),

('HIGH_SCHOOL', '이든배움국어상동3관', '상동고', '이창완 선생님', '/assets/teachers/이창완.jpg',
 '[{"grade":"고1","time":"토 18:00~21:00"},{"grade":"고2","time":"일 19:00~22:00"},{"grade":"고3","time":"일 10:00~13:00"}]', 2),

('HIGH_SCHOOL', '이든배움국어본관', '송내고', '이우용 선생님', '/assets/teachers/이우용.jpg',
 '[{"grade":"고1","time":"일 16:00~19:00"},{"grade":"고2","time":"토 16:00~19:00"},{"grade":"고3","time":"토 19:00~22:00"}]', 3),

('HIGH_SCHOOL', '이든배움국어본관', '부명고', '박옥선 선생님', '/assets/teachers/박옥선.jpg',
 '[{"grade":"고1","time":"토 10:00~13:00"},{"grade":"고2","time":"토 18:30~21:30 / 일 14:30~17:30"},{"grade":"고3","time":"토 13:00~16:00 / 일 19:00~22:00"}]', 4),

('HIGH_SCHOOL', '이든배움국어본관', '정명고', '박정영 선생님', '/assets/teachers/박정영.jpg',
 '[{"grade":"고1","time":"토 10:00~13:00"},{"grade":"고2","time":"토 15:00~18:00 / 일 10:00~13:00"},{"grade":"고3","time":"금 19:00~22:00 / 토 19:00~22:00"}]', 5),

('HIGH_SCHOOL', '이든배움국어상동3관', '상일고', '권지영 선생님', '/assets/teachers/권지영.jpg',
 '[{"grade":"고1","time":"토 16:00~19:00"},{"grade":"고2","time":"토 19:00~22:00"},{"grade":"고3","time":"토 12:00~15:00 / 토 16:00~19:00"}]', 6),

('HIGH_SCHOOL', '이든배움국어상동5관', '중원·중흥고', '김소솜 선생님', '/assets/teachers/김소솜.jpg',
 '{"schools":[{"name":"중원고","schedule":[{"grade":"고1","time":"토 10:00~13:00"},{"grade":"고2","time":"토 16:00~19:00"},{"grade":"고3","time":"일 19:00~22:00"}]},{"name":"중흥고","schedule":[{"grade":"고1","time":"일 14:00~17:00"},{"grade":"고2","time":"일 10:00~13:00"},{"grade":"고3","time":"일 19:00~22:00"}]}]}', 7),

('HIGH_SCHOOL', '이든배움국어본관', '계남고', '백슬기 선생님', '/assets/teachers/백슬기.jpg',
 '[{"grade":"고1","time":"토 14:00~17:00"},{"grade":"고3","time":"토 10:00~13:00"}]', 8),

('HIGH_SCHOOL', '이든배움국어상동3관', '소명여고·상동중', '박서연 선생님', '/assets/teachers/박서연.jpg',
 '{"schools":[{"name":"소명여고","schedule":[{"grade":"고1","time":"일 18:00~21:00"}]},{"name":"상동중","schedule":[{"grade":"1학년","time":"토 16:00~18:30"},{"grade":"2학년","time":"토 12:30~15:30"},{"grade":"3학년","time":"일 14:00~17:00"}]}]}', 9);

-- 중등부
INSERT INTO teacher_display (section, branch, school, name, photo_url, schedule_data, sort_order) VALUES
('MIDDLE_SCHOOL', '이든배움국어본관', '상일중', '김태경 선생님', '/assets/teachers/김태경.jpg',
 '[{"grade":"1학년","time":"토 14:00~16:30"},{"grade":"2학년","time":"토 10:00~13:00 / 일 17:00~20:00"},{"grade":"3학년","time":"토 17:00~20:00 / 일 14:00~17:00"}]', 1),

('MIDDLE_SCHOOL', '이든배움국어상동5관', '석천중', '심미숙 선생님', '/assets/teachers/심미숙.jpg',
 '[{"grade":"1학년","time":"토 14:00~16:30"},{"grade":"2학년","time":"일 17:00~20:00"},{"grade":"3학년","time":"토 10:00~13:00"}]', 2);

-- 수능올인반
INSERT INTO teacher_display (section, name, photo_url, schedule_data, sort_order) VALUES
('SUNEUNG', '라영서 선생님', '/assets/teachers/라영서.jpg', '[{"grade":"","time":"일 14:00~17:00"}]', 1),
('SUNEUNG', '박정영 선생님', '/assets/teachers/박정영.jpg', '[{"grade":"","time":"일 18:00~21:00"}]', 2),
('SUNEUNG', '이우용 선생님', '/assets/teachers/이우용.jpg', '[{"grade":"","time":"일 19:00~22:00"}]', 3),
('SUNEUNG', '이창완 선생님', '/assets/teachers/이창완.jpg', '[{"grade":"","time":"토 14:00~17:00"}]', 4);

-- 초등부
INSERT INTO teacher_display (section, name, photo_url, sort_order) VALUES
('ELEMENTARY', '서미정 원장님', '/assets/teachers/서미정.png', 1),
('ELEMENTARY', '강지하 선생님', '/assets/teachers/강지하.jpg', 2),
('ELEMENTARY', '민지연 선생님', '/assets/teachers/민지연.jpg', 3);

-- 운영진
INSERT INTO teacher_display (section, name, role, photo_url, sort_order) VALUES
('STAFF', '서효정', '대표원장', '/assets/teachers/서효정.jpg', 1),
('STAFF', '정훈', '부원장', '/assets/teachers/정훈.jpg', 2),
('STAFF', '김진옥', '상담실장', '/assets/teachers/김진옥.jpg', 3),
('STAFF', '장소연', '운영실장', '/assets/teachers/장소연.jpg', 4),
('STAFF', '권나연', '운영실장', '/assets/teachers/권나연.jpg', 5);
