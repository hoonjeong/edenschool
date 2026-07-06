import { stripHtml } from '@/lib/sanitize';

/** 본문 HTML에서 앞부분 텍스트를 잘라 발췌로 만든다 (요약이 아닌 원문 일부). 텍스트가 없으면 '' */
export function toPreviewText(html?: string, maxLen = 160): string {
  if (!html) return '';
  // 문단/줄바꿈 경계를 공백으로 바꿔 단어가 붙지 않게 한 뒤 태그 제거
  const spaced = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ');
  const text = stripHtml(spaced).replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

/** 본문 HTML에서 첫 번째 이미지 URL을 추출. 없으면 null.
 *  레거시 상대경로(image-view.html?id=..)는 루트 기준 절대경로로 보정한다. */
export function extractFirstImage(html?: string): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!m) return null;
  const src = m[1].trim();
  if (!src) return null;
  // 절대 URL / data URI / 루트 경로는 그대로 사용
  if (/^(https?:|data:|\/)/i.test(src)) return src;
  // 상대경로(예: image-view.html?id=123)는 루트 기준으로 보정
  return '/' + src.replace(/^\.?\/*/, '');
}
