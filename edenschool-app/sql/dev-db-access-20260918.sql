-- ─────────────────────────────────────────────────────────────
-- 개발환경 DB 접속 허용 (오라클 서버, 2026-09-18)
--
-- 실행 위치: 오라클 서버에서 DB 관리자 권한으로
--   ssh -i ssh/ssh-key-2026-06-28.key ubuntu@140.245.76.4
--   sudo mysql
--
-- ⚠ 운영 계정(edenmanager)의 비밀번호는 절대 바꾸지 말 것.
--   운영 Next.js 앱이 그 계정으로 붙어 있어서 ALTER USER 하는 순간 서비스가 끊긴다.
--   대신 개발 전용 계정을 따로 만든다.
-- ─────────────────────────────────────────────────────────────


-- ── 0단계: 현재 상태 진단 (먼저 실행해서 결과 확인) ──
-- edenmanager 가 어떤 호스트로 등록돼 있는지, 익명 계정이 있는지 본다.
SELECT user, host, plugin FROM mysql.user ORDER BY user, host;

-- ''@'localhost' (익명 계정) 이 있으면 edenmanager@'%' 보다 우선 매칭되어
-- 터널 접속이 거부된다. 아래에서 처리한다.


-- ── 1단계: 개발 전용 계정 생성 ──
-- SSH 터널을 쓰면 서버 입장에서 접속 출발지가 localhost 이므로 host 는 'localhost'.
-- <개발용비밀번호> 를 실제 값으로 바꿔서 실행할 것.

CREATE USER IF NOT EXISTS 'edendev'@'localhost' IDENTIFIED BY '<개발용비밀번호>';

-- (A) 읽기 전용으로 쓸 경우 — 권장. 스키마 확인·데이터 조회만 가능.
GRANT SELECT ON edenschool.* TO 'edendev'@'localhost';
GRANT SELECT ON edenbooks.*  TO 'edendev'@'localhost';

-- (B) 로컬로 덤프를 뜨려면 아래 권한이 추가로 필요하다.
GRANT SHOW VIEW, LOCK TABLES, PROCESS ON *.* TO 'edendev'@'localhost';

FLUSH PRIVILEGES;


-- ── 2단계: 익명 계정 때문에 막히는 경우에만 ──
-- 0단계 결과에 user 가 빈 문자열('')인 행이 있으면 실행한다.
-- 익명 계정은 보안상으로도 없는 편이 낫다.
--
-- DROP USER ''@'localhost';
-- FLUSH PRIVILEGES;


-- ── 확인 ──
SHOW GRANTS FOR 'edendev'@'localhost';


-- ─────────────────────────────────────────────────────────────
-- 적용 후 로컬에서 쓰는 법
--
-- 1) 터널 띄우기 (터미널 하나 계속 열어둠)
--    ssh -i ssh/ssh-key-2026-06-28.key -N -L 13306:127.0.0.1:3306 ubuntu@140.245.76.4
--
-- 2) apps/root/.env.local 생성 (.env 보다 우선 적용됨, git 에는 올라가지 않음)
--    DB_HOST=127.0.0.1
--    DB_PORT=13306
--    DB_USER=edendev
--    DB_PASSWORD=<개발용비밀번호>
--
-- 3) 접속 확인
--    mysql -h 127.0.0.1 -P 13306 -u edendev -p edenschool --ssl-mode=DISABLED -e "SHOW CREATE TABLE aca_part\G"
--
-- ※ 3306 을 외부에 직접 열지 말 것. 터널이면 충분하고, 방화벽을 열면
--   운영 DB가 인터넷에 노출된다.
-- ─────────────────────────────────────────────────────────────
