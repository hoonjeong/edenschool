import { describe, it, expect } from 'vitest';
import {
  BOARD_CATEGORIES,
  boardListPath,
  boardPostPath,
  categoryByCode,
  categoryBySlug,
  toTitleSlug,
} from './board';

describe('toTitleSlug', () => {
  it('한글 제목을 하이픈 슬러그로 만든다', () => {
    expect(toTitleSlug('2026학년도 수시 변경 사항 안내')).toBe('2026학년도-수시-변경-사항-안내');
  });

  it('영문은 소문자로 정규화한다', () => {
    expect(toTitleSlug('Winter Special Class')).toBe('winter-special-class');
  });

  it('특수문자·따옴표·이모지는 구분자로 바뀌고 앞뒤 하이픈은 제거한다', () => {
    expect(toTitleSlug('  [공지] 겨울방학 특강!! ✨  ')).toBe('공지-겨울방학-특강');
  });

  it('HTML 태그는 제거한다', () => {
    expect(toTitleSlug('<b>중요</b> 안내')).toBe('중요-안내');
  });

  it('슬러그로 남는 글자가 없으면 post 로 대체한다', () => {
    expect(toTitleSlug('!!! ???')).toBe('post');
    expect(toTitleSlug('')).toBe('post');
  });

  it('80자를 넘기지 않고 끝에 하이픈을 남기지 않는다', () => {
    const slug = toTitleSlug('가나다라마바사 '.repeat(30));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('boardPostPath', () => {
  it('카테고리 슬러그 + id + 제목 슬러그로 조립한다', () => {
    const path = boardPostPath({ id: 123, subject: '겨울방학 특강 안내', category: 'N' });
    expect(decodeURI(path)).toBe('/board/notice/123-겨울방학-특강-안내');
  });

  it('알 수 없는 카테고리는 기본 카테고리(notice)로 떨어진다', () => {
    expect(boardPostPath({ id: 1, subject: 'test', category: 'ZZZ' })).toBe('/board/notice/1-test');
    expect(boardPostPath({ id: 1, subject: 'test', category: null })).toBe('/board/notice/1-test');
  });

  it('한글 부분은 퍼센트 인코딩되고 decodeURI 로 원복된다(정식 URL 비교에 사용)', () => {
    const path = boardPostPath({ id: 7, subject: '수능 국어 대비', category: 'C' });
    expect(path).toContain('%');
    expect(decodeURI(path)).toBe('/board/admission/7-수능-국어-대비');
  });
});

describe('boardListPath', () => {
  it('1페이지는 쿼리를 붙이지 않는다(중복 URL 방지)', () => {
    expect(boardListPath('notice')).toBe('/board/notice');
    expect(boardListPath('notice', 1)).toBe('/board/notice');
  });

  it('2페이지부터 ?page= 를 붙인다', () => {
    expect(boardListPath('review', 3)).toBe('/board/review?page=3');
  });
});

describe('카테고리 조회', () => {
  it('code ↔ slug 가 서로 매핑된다', () => {
    for (const cat of BOARD_CATEGORIES) {
      expect(categoryBySlug(cat.slug)).toBe(cat);
      expect(categoryByCode(cat.code)).toBe(cat);
    }
  });

  it('slug 는 중복되지 않는다', () => {
    const slugs = BOARD_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('없는 값은 undefined', () => {
    expect(categoryBySlug('nope')).toBeUndefined();
    expect(categoryByCode('X')).toBeUndefined();
    expect(categoryByCode(undefined)).toBeUndefined();
  });
});
