import { describe, it, expect } from 'vitest';
import {
  BOARD_CATEGORIES,
  boardListPath,
  boardPostPath,
  categoryByCode,
  categoryBySlug,
  encodePathname,
  isSamePath,
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
    expect(boardPostPath({ id: 123, subject: '겨울방학 특강 안내', category: 'N' }))
      .toBe('/board/notice/123-겨울방학-특강-안내');
  });

  it('알 수 없는 카테고리는 기본 카테고리(notice)로 떨어진다', () => {
    expect(boardPostPath({ id: 1, subject: 'test', category: 'ZZZ' })).toBe('/board/notice/1-test');
    expect(boardPostPath({ id: 1, subject: 'test', category: null })).toBe('/board/notice/1-test');
  });

  it('퍼센트 인코딩하지 않은 원본 경로를 돌려준다(리디렉트에 그대로 쓰기 위함)', () => {
    expect(boardPostPath({ id: 7, subject: '수능 국어 대비', category: 'C' }))
      .not.toContain('%');
  });
});

describe('encodePathname', () => {
  it('세그먼트만 인코딩하고 / 는 보존한다', () => {
    expect(encodePathname('/board/admission/7-수능-국어-대비'))
      .toBe('/board/admission/7-%EC%88%98%EB%8A%A5-%EA%B5%AD%EC%96%B4-%EB%8C%80%EB%B9%84');
  });

  it('ASCII 경로는 그대로 둔다', () => {
    expect(encodePathname('/board/notice/1-test')).toBe('/board/notice/1-test');
  });
});

describe('isSamePath — 리디렉트 루프 방지', () => {
  const canonical = boardPostPath({ id: 12, subject: '겨울방학 특강 안내', category: 'N' });

  it('디코딩된 요청 경로를 같다고 본다', () => {
    expect(isSamePath('/board/notice/12-겨울방학-특강-안내', canonical)).toBe(true);
  });

  it('퍼센트 인코딩된 요청 경로도 같다고 본다', () => {
    expect(isSamePath(encodePathname(canonical), canonical)).toBe(true);
  });

  it('이중 인코딩된 요청 경로도 같다고 본다', () => {
    expect(isSamePath(encodePathname(encodePathname(canonical)), canonical)).toBe(true);
  });

  it('유니코드 정규화(NFD) 차이를 흡수한다', () => {
    expect(isSamePath(canonical.normalize('NFD'), canonical)).toBe(true);
  });

  it('실제로 다른 글/카테고리는 다르다고 본다', () => {
    expect(isSamePath('/board/story/12-겨울방학-특강-안내', canonical)).toBe(false);
    expect(isSamePath('/board/notice/12-다른-제목', canonical)).toBe(false);
  });

  it('잘못된 퍼센트 시퀀스가 들어와도 예외 없이 처리한다', () => {
    expect(() => isSamePath('/board/notice/12-%ZZ', canonical)).not.toThrow();
    expect(isSamePath('/board/notice/12-%ZZ', canonical)).toBe(false);
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
