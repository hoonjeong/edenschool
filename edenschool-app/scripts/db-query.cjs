#!/usr/bin/env node
/**
 * 읽기 전용 DB 조회 도구 (개발용)
 *
 *   node scripts/db-query.cjs "SELECT * FROM aca_part"
 *   node scripts/db-query.cjs --file sql/diagnose-sms-failures-20260918.sql
 *   node scripts/db-query.cjs --json "SHOW CREATE TABLE aca_part"
 *   node scripts/db-query.cjs --db edenbooks "SHOW TABLES"
 *
 * 안전장치 — 메모리의 "운영 DB 직접 변경 금지" 규칙을 도구 차원에서 강제한다.
 *   1) SELECT / SHOW / DESCRIBE / EXPLAIN / WITH 만 허용. 그 외는 실행 전에 거부.
 *   2) DB_HOST 가 127.0.0.1 / localhost 가 아니면 거부.
 *      → 운영 DB 에 직접 붙지 못하고 반드시 SSH 터널을 거치게 한다.
 *
 * 접속정보는 apps/root/.env → .env.local 순으로 읽는다(뒤가 우선).
 * 터널: ssh -i ssh/ssh-key-2026-06-28.key -N -L 13306:127.0.0.1:3306 ubuntu@140.245.76.4
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function loadEnv() {
  const env = {};
  for (const name of ['.env', '.env.local']) {
    const p = path.join(ROOT, 'apps/root', name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

function loadMysql() {
  // pnpm 워크스페이스라 scripts/ 에서는 mysql2 가 바로 안 잡힌다.
  for (const p of ['apps/root/node_modules/mysql2/promise', 'packages/common/node_modules/mysql2/promise']) {
    try {
      return require(path.join(ROOT, p));
    } catch {
      /* 다음 후보 */
    }
  }
  throw new Error('mysql2 를 찾을 수 없습니다. pnpm install 을 먼저 실행하세요.');
}

/** SQL 파일/문자열을 실행 가능한 문장 배열로 쪼갠다. (-- 주석 제거) */
function splitStatements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((l) => !/^\s*--/.test(l))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const READ_ONLY = /^(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN|WITH)\b/i;

function assertReadOnly(stmt) {
  if (!READ_ONLY.test(stmt)) {
    const head = stmt.split(/\s+/)[0];
    throw new Error(
      `읽기 전용 도구입니다. '${head}' 는 실행할 수 없습니다.\n` +
        `데이터 변경은 sql/ 에 마이그레이션 파일로 작성하고 사용자가 직접 적용합니다.`
    );
  }
}

async function main() {
  const argv = process.argv.slice(2);
  let asJson = false;
  let fromFile = null;
  let dbOverride = null;
  const rest = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') asJson = true;
    else if (argv[i] === '--file') fromFile = argv[++i];
    else if (argv[i] === '--db') dbOverride = argv[++i];
    else rest.push(argv[i]);
  }

  const sql = fromFile ? fs.readFileSync(path.resolve(fromFile), 'utf8') : rest.join(' ');
  if (!sql.trim()) {
    console.error('실행할 SQL 이 없습니다.\n  사용법: node scripts/db-query.cjs "SELECT ..."');
    process.exit(1);
  }

  const statements = splitStatements(sql);
  statements.forEach(assertReadOnly);

  const env = loadEnv();
  const host = env.DB_HOST || '';
  if (!/^(127\.0\.0\.1|localhost|::1)$/.test(host)) {
    console.error(
      `DB_HOST 가 '${host}' 입니다. 이 도구는 로컬(127.0.0.1) 접속만 허용합니다.\n` +
        `SSH 터널을 띄우고 apps/root/.env.local 에 DB_HOST=127.0.0.1 을 설정하세요.`
    );
    process.exit(1);
  }

  const mysql = loadMysql();
  const conn = await mysql.createConnection({
    host,
    port: Number(env.DB_PORT) || 3306,
    database: dbOverride || env.DB_NAME || 'edenschool',
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    charset: 'utf8',
  });

  try {
    for (const stmt of statements) {
      const [rows] = await conn.query(stmt);
      if (statements.length > 1) console.log(`\n── ${stmt.split(/\r?\n/)[0].slice(0, 70)} ──`);
      if (!Array.isArray(rows) || rows.length === 0) {
        console.log('(결과 없음)');
        continue;
      }
      if (asJson) console.log(JSON.stringify(rows, null, 2));
      else if (rows.length === 1 && Object.keys(rows[0]).length <= 2) console.log(Object.values(rows[0]).join('\n'));
      else console.table(rows);
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
