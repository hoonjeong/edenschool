import sanitizeHtml from 'sanitize-html';

/** Quill 에디터 출력에 맞춘 HTML 살균 (사용자 입력용) */
export function sanitizeUserHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'h1', 'h2', 'h3',
      'strong', 'b', 'em', 'i', 'u', 's',
      'ol', 'ul', 'li', 'blockquote', 'pre', 'code',
      'a', 'span', 'div', 'sub', 'sup',
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'span': ['style'],
      'div': ['style'],
    },
    allowedStyles: {
      '*': {
        'color': [/.*/],
        'background-color': [/.*/],
        'text-align': [/.*/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer',
      }),
    },
  });
}

/** 관리자 작성 콘텐츠용 HTML 살균 (img/iframe 허용, script/event handler 차단) */
export function sanitizeAdminHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'iframe', 'h1', 'h2',
      'span', 'div', 'sub', 'sup',
    ]),
    allowedAttributes: {
      '*': ['style', 'class'],
      // Quill 에디터는 목록 종류(bullet/ordered)를 li 의 data-list 에 담고 태그는 항상 <ol> 이다.
      // 이 속성이 지워지면 글머리 기호가 숫자로 바뀐다.
      'li': ['data-list'],
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com'],
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

/** HTML 속성값 이스케이프 (속성 주입용) */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * alt 속성이 없는 <img>에 기본 alt 텍스트를 주입한다 (SEO/접근성).
 * 이미 alt가 있는 이미지는 건드리지 않는다.
 */
export function addImageAlt(html: string, alt: string): string {
  const safeAlt = escapeAttr(alt || '');
  return html.replace(
    /<img\b(?![^>]*\salt=)([^>]*?)>/gi,
    `<img alt="${safeAlt}"$1>`
  );
}

/** 프로토콜·프로토콜상대(//)·루트절대(/)·앵커(#) 로 시작하면 이미 절대경로 */
const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.\-]*:|\/\/|\/|#)/i;

/**
 * 레거시 본문의 상대경로 src/href 를 루트 기준 절대경로로 보정한다.
 *
 * 구 JSP 게시글 본문은 `<img src="image-view.html?id=123">` 처럼 상대경로를 쓴다.
 * 예전 주소(/post-view)에서는 브라우저가 /image-view.html 로 풀어서 next.config 의
 * rewrite 에 걸렸지만, 주소가 /board/{카테고리}/{슬러그} 로 깊어지면
 * /board/{카테고리}/image-view.html 로 풀려 이미지가 전부 깨진다.
 * 본문에서 미리 절대경로로 바꿔 두면 주소 깊이와 무관해진다.
 */
export function absolutizeLegacyPaths(html: string): string {
  return html.replace(
    /(\s(?:src|href)\s*=\s*)(["'])([^"']*)\2/gi,
    (full, prefix: string, quote: string, url: string) => {
      const trimmed = url.trim();
      if (!trimmed || ABSOLUTE_URL.test(trimmed)) return full;
      return `${prefix}${quote}/${trimmed.replace(/^\.?\/*/, '')}${quote}`;
    },
  );
}

/** HTML 태그 제거 → 순수 텍스트 추출 */
export function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
