import { describe, expect, it } from 'vitest';
import { normalizeRecipientPhone, parseRecipientText } from './sms-recipients';

describe('normalizeRecipientPhone', () => {
  it('하이픈·공백·괄호를 제거한다', () => {
    expect(normalizeRecipientPhone('010-1234-5678')).toBe('01012345678');
    expect(normalizeRecipientPhone('010 1234 5678')).toBe('01012345678');
    expect(normalizeRecipientPhone('(010) 1234-5678')).toBe('01012345678');
  });

  it('엑셀이 숫자로 저장해 앞 0 이 빠진 번호를 복구한다', () => {
    expect(normalizeRecipientPhone(1012345678)).toBe('01012345678');
    expect(normalizeRecipientPhone('1012345678')).toBe('01012345678');
  });

  it('국가번호 +82 를 0 으로 바꾼다', () => {
    expect(normalizeRecipientPhone('+82 10-1234-5678')).toBe('01012345678');
  });

  it('휴대폰 번호가 아니면 null', () => {
    expect(normalizeRecipientPhone('')).toBeNull();
    expect(normalizeRecipientPhone(null)).toBeNull();
    expect(normalizeRecipientPhone('홍길동')).toBeNull();
    expect(normalizeRecipientPhone('02-123-4567')).toBeNull(); // 유선
    expect(normalizeRecipientPhone('0101234')).toBeNull(); // 자릿수 부족
    expect(normalizeRecipientPhone('010123456789')).toBeNull(); // 자릿수 초과
  });
});

describe('parseRecipientText', () => {
  it('쉼표·개행·세미콜론으로 나눈다', () => {
    const r = parseRecipientText('010-1111-2222, 01033334444\n010 5555 6666;01077778888');
    expect(r.valid.map((v) => v.phone)).toEqual(['01011112222', '01033334444', '01055556666', '01077778888']);
    expect(r.invalid).toHaveLength(0);
  });

  it('중복 번호는 한 번만 남기고 건수를 센다', () => {
    const r = parseRecipientText('010-1111-2222\n01011112222\n010 1111 2222');
    expect(r.valid).toHaveLength(1);
    expect(r.duplicates).toBe(2);
  });

  it('번호가 아닌 항목은 invalid 로 분리하고 원본을 보존한다', () => {
    const r = parseRecipientText('01011112222\n홍길동\n02-123-4567');
    expect(r.valid).toHaveLength(1);
    expect(r.invalid.map((v) => v.source)).toEqual(['홍길동', '02-123-4567']);
  });

  it('빈 줄·공백만 있는 토큰은 무시한다', () => {
    const r = parseRecipientText('\n\n  01011112222  \n,,\n');
    expect(r.valid).toHaveLength(1);
    expect(r.invalid).toHaveLength(0);
  });
});
