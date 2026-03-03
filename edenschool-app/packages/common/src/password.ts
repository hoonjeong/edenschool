import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  // 마이그레이션 기간: 기존 시스템(Java/SHA1)과 동일한 해싱 사용
  // DB pw 컬럼이 40자 제한이므로 bcrypt(60자) 사용 시 잘림 발생
  // 기존 시스템 폐기 후 bcrypt로 전환 예정
  return createHash('sha1').update(plain).digest('hex');
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
