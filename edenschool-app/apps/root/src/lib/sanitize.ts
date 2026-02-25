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
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com'],
    allowedSchemes: ['http', 'https', 'mailto'],
  });
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
