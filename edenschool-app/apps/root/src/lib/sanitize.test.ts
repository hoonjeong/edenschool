import { describe, expect, it } from 'vitest';
import { addImageAlt, sanitizeAdminHtml, sanitizeUserHtml, stripHtml } from './sanitize';

// 게시글·수강후기 본문이 전부 이 살균기를 거친다. 허용 목록이 좁아지면 기존 글이 깨지고,
// 넓어지면 XSS가 열린다. 양쪽을 다 고정해 둔다.

describe('sanitizeUserHtml — 사용자 입력', () => {
  it('script 와 이벤트 핸들러를 제거한다', () => {
    expect(sanitizeUserHtml('<p>안녕</p><script>alert(1)</script>')).toBe('<p>안녕</p>');
    expect(sanitizeUserHtml('<p onclick="alert(1)">안녕</p>')).toBe('<p>안녕</p>');
  });

  it('기본 서식 태그는 남긴다', () => {
    expect(sanitizeUserHtml('<p><strong>굵게</strong> <em>기울임</em></p>')).toBe(
      '<p><strong>굵게</strong> <em>기울임</em></p>',
    );
  });

  it('링크에 target/rel 을 붙인다', () => {
    const out = sanitizeUserHtml('<a href="https://example.com">링크</a>');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('javascript: 스킴을 막는다', () => {
    expect(sanitizeUserHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  it('사용자 입력에는 이미지를 허용하지 않는다', () => {
    expect(sanitizeUserHtml('<img src="/a.jpg">')).toBe('');
  });
});

describe('sanitizeAdminHtml — 관리자 작성 콘텐츠', () => {
  it('이미지를 허용한다', () => {
    expect(sanitizeAdminHtml('<img src="/upload/a.jpg" alt="사진">')).toContain('<img');
  });

  it('유튜브·비메오 iframe 만 허용한다', () => {
    expect(sanitizeAdminHtml('<iframe src="https://www.youtube.com/embed/x"></iframe>')).toContain(
      'src="https://www.youtube.com/embed/x"',
    );
    expect(sanitizeAdminHtml('<iframe src="https://player.vimeo.com/video/1"></iframe>')).toContain(
      'src="https://player.vimeo.com/video/1"',
    );
  });

  it('허용되지 않은 호스트의 iframe 은 src 를 떼어내 아무것도 못 불러오게 한다', () => {
    // 빈 <iframe></iframe> 태그는 남지만 로드할 주소가 없다(sanitize-html 의 동작).
    expect(sanitizeAdminHtml('<iframe src="https://evil.com/x"></iframe>')).toBe('<iframe></iframe>');
  });

  it('script 는 관리자 글에서도 제거한다', () => {
    expect(sanitizeAdminHtml('<p>글</p><script>alert(1)</script>')).toBe('<p>글</p>');
  });

  it('li 의 data-list 를 남긴다 (에디터 글머리 기호가 숫자로 바뀌던 문제)', () => {
    const out = sanitizeAdminHtml('<ol><li data-list="bullet">항목</li></ol>');
    expect(out).toContain('data-list="bullet"');
  });
});

describe('addImageAlt', () => {
  it('alt 가 없는 img 에만 넣는다', () => {
    expect(addImageAlt('<img src="/a.jpg">', '제목')).toBe('<img alt="제목" src="/a.jpg">');
  });

  it('이미 alt 가 있으면 건드리지 않는다', () => {
    const html = '<img alt="원래" src="/a.jpg">';
    expect(addImageAlt(html, '제목')).toBe(html);
  });

  it('alt 값의 따옴표를 이스케이프한다', () => {
    expect(addImageAlt('<img src="/a.jpg">', '"큰따옴표"')).toContain('alt="&quot;큰따옴표&quot;"');
  });
});

describe('stripHtml', () => {
  it('태그를 지우고 엔티티를 되돌린다', () => {
    expect(stripHtml('<p>안녕 &amp; 반가워</p>')).toBe('안녕 & 반가워');
  });

  it('&nbsp; 는 공백으로 바꾸고 앞뒤를 다듬는다', () => {
    expect(stripHtml('<p>&nbsp;글&nbsp;</p>')).toBe('글');
  });
});
