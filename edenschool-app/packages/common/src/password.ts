import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const BCRYPT_ROUNDS = 12;

// bcrypt 전환 플래그(무중단 롤아웃/롤백 스위치). user_info.pw, admin_user_info.pw가
// 모두 VARCHAR(100)이라 bcrypt 해시(60자)가 그대로 저장되므로 DB 변경은 불필요하다.
// 'true'면 신규/변경 비밀번호를 bcrypt로 저장하고 로그인 시 SHA1->bcrypt 재해싱이 동작한다.
// 'false'(기본)면 기존 SHA1 동작을 유지한다. 재배포 없이 토글/롤백 가능.
const BCRYPT_ENABLED = process.env.PASSWORD_BCRYPT_ENABLED === 'true';

export async function hashPassword(plain: string): Promise<string> {
  if (BCRYPT_ENABLED) {
    // bcrypt 해시는 60자 → pw 컬럼(VARCHAR(100))에 안전하게 저장된다.
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }
  // 기본 동작: 기존 시스템(Java/SHA1)과 동일한 40자 해시.
  return createHash('sha1').update(plain).digest('hex');
}

/**
 * 로그인 성공 직후 레거시 SHA1(40-hex) 해시를 bcrypt로 재해싱(rehash-on-login)할지 판별.
 * bcrypt가 활성화된 경우에만 재해싱 대상으로 본다.
 */
export function needsRehash(hash: string): boolean {
  return BCRYPT_ENABLED && /^[a-f0-9]{40}$/i.test(hash);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // bcrypt hashes start with $2b$ (or $2a$, $2y$) and are 60 chars
  if (hash.startsWith('$2')) {
    return bcrypt.compare(plain, hash);
  }

  // Legacy fallback: SHA1 hex string (40 chars)
  if (/^[a-f0-9]{40}$/i.test(hash)) {
    const sha1 = createHash('sha1').update(plain).digest('hex');
    return sha1.toLowerCase() === hash.toLowerCase();
  }

  return false;
}
