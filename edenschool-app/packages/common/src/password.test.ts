import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// BCRYPT_ENABLED 를 모듈 로드 시점에 읽으므로, 플래그별 동작을 보려면 모듈을 다시 불러와야 한다.
async function loadPassword(bcryptEnabled: boolean) {
  vi.resetModules();
  vi.stubEnv('PASSWORD_BCRYPT_ENABLED', bcryptEnabled ? 'true' : 'false');
  return import('./password');
}

const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('hashPassword — 플래그 OFF(기본)', () => {
  it('기존 시스템과 같은 SHA1 40자를 낸다', async () => {
    const { hashPassword } = await loadPassword(false);
    const hash = await hashPassword('eden1234');
    expect(hash).toBe(sha1('eden1234'));
    expect(hash).toHaveLength(40);
  });
});

describe('hashPassword — 플래그 ON', () => {
  it('bcrypt 해시(60자, $2 시작)를 낸다', async () => {
    const { hashPassword } = await loadPassword(true);
    const hash = await hashPassword('eden1234');
    expect(hash.startsWith('$2')).toBe(true);
    expect(hash).toHaveLength(60);
  });

  it('같은 비밀번호라도 매번 다른 해시(솔트)', async () => {
    const { hashPassword } = await loadPassword(true);
    expect(await hashPassword('eden1234')).not.toBe(await hashPassword('eden1234'));
  });
});

describe('verifyPassword — 두 방식을 모두 받아준다', () => {
  it('SHA1 해시를 검증한다(레거시 계정)', async () => {
    const { verifyPassword } = await loadPassword(false);
    expect(await verifyPassword('eden1234', sha1('eden1234'))).toBe(true);
    expect(await verifyPassword('wrong', sha1('eden1234'))).toBe(false);
  });

  it('대문자 SHA1 도 검증한다', async () => {
    const { verifyPassword } = await loadPassword(false);
    expect(await verifyPassword('eden1234', sha1('eden1234').toUpperCase())).toBe(true);
  });

  it('bcrypt 해시를 검증한다', async () => {
    const { hashPassword, verifyPassword } = await loadPassword(true);
    const hash = await hashPassword('eden1234');
    expect(await verifyPassword('eden1234', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('플래그가 꺼져 있어도 bcrypt 계정은 계속 로그인된다(롤백 안전)', async () => {
    const { hashPassword } = await loadPassword(true);
    const hash = await hashPassword('eden1234');
    const { verifyPassword } = await loadPassword(false);
    expect(await verifyPassword('eden1234', hash)).toBe(true);
  });

  it('알 수 없는 형식의 해시는 무조건 실패시킨다', async () => {
    const { verifyPassword } = await loadPassword(false);
    expect(await verifyPassword('eden1234', '')).toBe(false);
    expect(await verifyPassword('eden1234', 'plaintext')).toBe(false);
  });
});

describe('needsRehash — 로그인 시 SHA1→bcrypt 전환 판단', () => {
  it('플래그 ON + SHA1 해시일 때만 true', async () => {
    const { needsRehash } = await loadPassword(true);
    expect(needsRehash(sha1('eden1234'))).toBe(true);
  });

  it('플래그 ON 이어도 이미 bcrypt 면 false', async () => {
    const { hashPassword, needsRehash } = await loadPassword(true);
    expect(needsRehash(await hashPassword('eden1234'))).toBe(false);
  });

  it('플래그 OFF 면 SHA1 이라도 false', async () => {
    const { needsRehash } = await loadPassword(false);
    expect(needsRehash(sha1('eden1234'))).toBe(false);
  });
});
