-- 「이든 진로탐색 도우미」 나의 진로 포트폴리오 (학원생 로그인 전용)
-- 관심 학과·직업, 심리검사 결과 링크, 오늘의 직업 읽기 요약을 한곳에 모은다.
-- 적용: 운영 DB(edenschool)에 수동 실행. 적용 전에는 /career/portfolio 가 "준비 중" 안내를 보여 준다.

CREATE TABLE IF NOT EXISTS career_portfolio (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL COMMENT 'user_info.id',
  kind        VARCHAR(16)  NOT NULL COMMENT 'major | job | test | summary',
  ref_id      VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '커리어넷 학과코드·직업코드·검사번호',
  title       VARCHAR(200) NOT NULL COMMENT '학과명·직업명·검사명·(날짜 직업명)',
  content     TEXT         NULL COMMENT '검사 결과 URL 또는 요약 문장',
  insert_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_career_portfolio_user (user_id, kind, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
