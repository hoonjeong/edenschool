import { describe, expect, it } from 'vitest';
import { toPreviewText, srcToUrl } from './board-preview';

// 목록 미리보기는 SQL LEFT(contents, N) 으로 잘린 HTML 을 받는다.
// 자르는 지점이 태그 한가운데면 태그 조각이 화면에 노출되던 회귀를 고정한다.
describe('toPreviewText — 잘린 HTML 처리', () => {
  it('태그 중간에서 잘려도 태그 조각이 노출되지 않는다', () => {
    const cut = '<p>안내드립니다</p><p style="color:red;font-size:14px;font-fam';
    const out = toPreviewText(cut);
    expect(out).toBe('안내드립니다');
    expect(out).not.toContain('<');
    expect(out).not.toContain('style');
  });

  it('여는 꺾쇠만 남아도 처리한다', () => {
    expect(toPreviewText('본문입니다<')).toBe('본문입니다');
    expect(toPreviewText('본문입니다<div')).toBe('본문입니다');
  });

  it('잘린 엔티티 조각을 남기지 않는다', () => {
    expect(toPreviewText('가격 비교&nbs')).toBe('가격 비교');
    expect(toPreviewText('숫자 &#3')).toBe('숫자');
  });

  it('끝에 온전한 엔티티는 정상 변환한다', () => {
    expect(toPreviewText('A &amp;')).toBe('A &');
    expect(toPreviewText('공백&nbsp;')).toBe('공백');
  });

  it('정상 HTML 은 그대로 텍스트만 뽑는다', () => {
    expect(toPreviewText('<p>겨울방학 <b>특강</b> 안내</p>')).toBe('겨울방학 특강 안내');
  });

  it('maxLen 을 넘으면 말줄임을 붙인다', () => {
    const long = '<p>' + '가'.repeat(200) + '</p>';
    const out = toPreviewText(long);
    expect(out.length).toBe(101);
    expect(out.endsWith('…')).toBe(true);
  });

  it('빈 값은 빈 문자열', () => {
    expect(toPreviewText('')).toBe('');
    expect(toPreviewText(null)).toBe('');
    expect(toPreviewText(undefined)).toBe('');
    expect(toPreviewText('<p></p>')).toBe('');
  });
});

describe('srcToUrl', () => {
  it('레거시 상대경로를 루트 절대경로로 만든다', () => {
    expect(srcToUrl('image-view.html?id=1')).toBe('/image-view.html?id=1');
    expect(srcToUrl('./image-view.html?id=1')).toBe('/image-view.html?id=1');
  });

  it('이미 절대경로면 그대로 둔다', () => {
    expect(srcToUrl('/api/legacy-image?id=1')).toBe('/api/legacy-image?id=1');
    expect(srcToUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('src="..." 조각에서 경로만 뽑는다', () => {
    expect(srcToUrl('src="image-view.html?id=7"')).toBe('/image-view.html?id=7');
  });

  it('없으면 null', () => {
    expect(srcToUrl(null)).toBeNull();
    expect(srcToUrl('')).toBeNull();
  });
});

// 목록 쿼리는 본문 앞부분만 잘라온다. 태그를 걷어내면 100자에 못 미치더라도
// 실제 글은 더 길므로 말줄임이 보여야 한다.
describe('toPreviewText - 원본이 잘린 경우 말줄임', () => {
  it('잘린 원본이면 100자 미만이어도 말줄임을 붙인다', () => {
    expect(toPreviewText('<p>짧은 도입부</p><div class="x', 100, true)).toBe('짧은 도입부…');
  });

  it('잘리지 않은 원본이면 짧을 때 말줄임을 붙이지 않는다', () => {
    expect(toPreviewText('<p>짧은 글</p>', 100, false)).toBe('짧은 글');
    expect(toPreviewText('<p>짧은 글</p>')).toBe('짧은 글');
  });

  it('100자를 넘으면 잘림 여부와 무관하게 말줄임을 붙인다', () => {
    const long = '<p>' + '가'.repeat(200) + '</p>';
    expect(toPreviewText(long, 100, false).endsWith('…')).toBe(true);
    expect(toPreviewText(long, 100, true).endsWith('…')).toBe(true);
  });

  it('텍스트가 하나도 없으면 말줄임만 남기지 않는다', () => {
    expect(toPreviewText('<div class="a"><span style="x', 100, true)).toBe('');
    expect(toPreviewText('<p></p>', 100, true)).toBe('');
  });
});
