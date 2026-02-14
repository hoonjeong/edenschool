import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
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
