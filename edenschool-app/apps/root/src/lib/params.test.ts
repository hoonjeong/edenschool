import { describe, expect, it } from 'vitest';
import { toId } from './params';

// 잘못된 URL 파라미터가 NaN 으로 SQL 에 흘러들어 500 을 내던 것을 막는 가드.
describe('toId', () => {
  it('정상적인 양의 정수를 통과시킨다', () => {
    expect(toId('1')).toBe(1);
    expect(toId('12345')).toBe(12345);
    expect(toId(42)).toBe(42);
  });

  it('undefined/null/빈값을 거른다', () => {
    expect(toId(undefined)).toBeNull();
    expect(toId(null)).toBeNull();
    expect(toId('')).toBeNull();
    // 링크가 잘못 만들어졌을 때 실제로 들어오던 값
    expect(toId('undefined')).toBeNull();
    expect(toId('null')).toBeNull();
    expect(toId('NaN')).toBeNull();
  });

  it('0 과 음수를 거른다 (DB ID 는 양수)', () => {
    expect(toId('0')).toBeNull();
    expect(toId('-1')).toBeNull();
    expect(toId(-5)).toBeNull();
  });

  it('정수가 아닌 표기를 거른다', () => {
    expect(toId('1.5')).toBeNull();
    expect(toId('1e3')).toBeNull();
    expect(toId('0x10')).toBeNull();
    expect(toId('12abc')).toBeNull();
    expect(toId('abc')).toBeNull();
    expect(toId(' 12 ')).toBe(12); // 앞뒤 공백만 허용
    expect(toId('1 2')).toBeNull();
  });

  it('안전 정수 범위를 넘으면 거른다', () => {
    expect(toId('9007199254740993')).toBeNull();
    expect(toId('99999999999999999999')).toBeNull();
  });

  it('문자열·숫자가 아닌 타입은 거른다', () => {
    expect(toId({})).toBeNull();
    expect(toId([])).toBeNull();
    expect(toId(['1'])).toBeNull();
    expect(toId(true)).toBeNull();
    expect(toId(NaN)).toBeNull();
    expect(toId(Infinity)).toBeNull();
  });
});
