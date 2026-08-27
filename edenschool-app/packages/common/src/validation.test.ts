import { describe, expect, it } from 'vitest';
import {
  getMaskedEmail,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  normalizePhone,
} from './validation';

// 로그인·가입·계정찾기가 모두 이 함수들을 거치므로, 여기가 바뀌면 인증 전체가 흔들린다.
// 지금 동작을 그대로 고정해 두는 것이 목적이다(개선안이 아니라 현 상태 기록).

describe('isValidEmail', () => {
  it('평범한 주소를 통과시킨다', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('hoonjeong.eden@gmail.com')).toBe(true);
  });

  it('@ 나 점이 없으면 거른다', () => {
    expect(isValidEmail('ab.co')).toBe(false);
    expect(isValidEmail('a@bco')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('공백이 섞이면 거른다', () => {
    expect(isValidEmail('a b@c.co')).toBe(false);
    expect(isValidEmail('a@b .co')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('영문+숫자 8자 이상이면 통과', () => {
    expect(isValidPassword('eden1234')).toBe(true);
    expect(isValidPassword('a1234567')).toBe(true);
  });

  it('8자 미만이면 거른다', () => {
    expect(isValidPassword('eden123')).toBe(false);
  });

  it('영문 또는 숫자가 빠지면 거른다', () => {
    expect(isValidPassword('edenedenedn')).toBe(false);
    expect(isValidPassword('12345678')).toBe(false);
  });

  it('특수문자는 요구하지 않는다', () => {
    expect(isValidPassword('eden1234!')).toBe(true);
  });
});

describe('isValidPhone', () => {
  it('하이픈이 있어도 없어도 통과', () => {
    expect(isValidPhone('01012345678')).toBe(true);
    expect(isValidPhone('010-1234-5678')).toBe(true);
  });

  it('010 외 011/016/017/018/019 도 통과', () => {
    for (const prefix of ['011', '016', '017', '018', '019']) {
      expect(isValidPhone(`${prefix}1234567`)).toBe(true);
    }
  });

  it('012 처럼 없는 국번은 거른다', () => {
    expect(isValidPhone('01212345678')).toBe(false);
  });

  it('자릿수가 모자라거나 넘치면 거른다', () => {
    expect(isValidPhone('010123456')).toBe(false);
    expect(isValidPhone('010123456789')).toBe(false);
  });

  it('공백은 제거하지 않으므로 거른다', () => {
    expect(isValidPhone('010 1234 5678')).toBe(false);
  });
});

describe('normalizePhone', () => {
  it('하이픈만 제거한다', () => {
    expect(normalizePhone('010-1234-5678')).toBe('01012345678');
    expect(normalizePhone('01012345678')).toBe('01012345678');
  });

  it('공백은 남긴다(현재 동작)', () => {
    expect(normalizePhone('010 1234 5678')).toBe('010 1234 5678');
  });
});

describe('getMaskedEmail', () => {
  it('아이디 4자 이상이면 뒤 3자를 가린다', () => {
    expect(getMaskedEmail('hoonjeong@gmail.com')).toBe('hoonje***@gmail.com');
    expect(getMaskedEmail('abcd@x.com')).toBe('a***@x.com');
  });

  it('아이디가 정확히 3자면 앞 1자만 남긴다', () => {
    expect(getMaskedEmail('abc@x.com')).toBe('a**@x.com');
  });

  it('아이디가 2자 이하면 전부 가린다', () => {
    expect(getMaskedEmail('ab@x.com')).toBe('**@x.com');
    expect(getMaskedEmail('a@x.com')).toBe('*@x.com');
  });

  it('이메일 형식이 아니면 그대로 돌려준다', () => {
    expect(getMaskedEmail('not-an-email')).toBe('not-an-email');
  });
});
