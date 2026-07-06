/** 본문 HTML(또는 태그가 섞인 텍스트)에서 앞부분을 잘라 발췌로 만든다.
 *  미리보기 전용이라 태그 제거는 가벼운 regex로 처리(결과는 JSX에서 escape되어 렌더). 없으면 '' */
export function toPreviewText(text0?: string | null, maxLen = 100): string {
  if (!text0) return '';
  const text = String(text0)
    .replace(/<[^>]*>/g, ' ') // 태그 제거
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/​/g, '') // zero-width space(빈 줄 마커) 제거
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

/** 쿼리에서 뽑은 이미지 경로(순수 URL 또는 `src="..."` 조각)를 썸네일 URL로 정규화. 없으면 null.
 *  레거시 상대경로(image-view.html?id=..)는 루트 기준 절대경로로 보정한다. */
export function srcToUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/src=["']?([^"'\s]+)/i);
  let src = (m ? m[1] : raw).trim();
  src = src.replace(/^["'\s]+/, '').replace(/["'\s]+$/, '');
  if (!src) return null;
  if (/^(https?:|data:|\/)/i.test(src)) return src;
  return '/' + src.replace(/^\.?\/*/, '');
}
