import * as cheerio from 'cheerio';

/** 프롬프트에 넣을 때의 상한 (토큰 낭비 방지) */
const LIMIT = { css: 20000, skeleton: 24000, guide: 6000 };

export interface ParsedTemplate {
  css: string;
  skeleton: string;
  guide: string;
  title: string;
  hasPaper: boolean;
}

type CheerioApi = cheerio.CheerioAPI;

// domhandler는 cheerio의 전이 의존성이라 직접 import할 수 없다(pnpm 격리).
// cheerio가 노출하는 타입에서 DOM 노드 타입을 유도해 쓴다.
type DomDocument = ReturnType<CheerioApi['root']>[number];
type DomNode = DomDocument['children'][number];

/** 모든 노드를 순회하며 주석 노드를 수집 */
function collectComments($: CheerioApi): DomNode[] {
  const out: DomNode[] = [];
  (function walk(children: DomNode[]) {
    for (const child of children) {
      if (child.type === 'comment') out.push(child);
      else if ('children' in child) walk(child.children as DomNode[]);
    }
  })($.root()[0].children as DomNode[]);
  return out;
}

function commentText(node: DomNode): string {
  return ('data' in node ? String(node.data ?? '') : '').trim();
}

/**
 * 등록 시점에 템플릿을 분석해 "AI에게 보낼 요약본"을 추출한다.
 * 원본 HTML 전체(base64 로고 등 포함)는 별도로 보관하고, 프롬프트에는 요약본만 쓴다.
 */
export function parseTemplate(html: string, filename = ''): ParsedTemplate {
  const $ = cheerio.load(html);

  const hasPaper = $('#paper').length > 0;
  const $paper = hasPaper ? $('#paper') : $('body');

  // (a) CSS — data: URI 는 잘라내어 토큰 낭비 방지
  const css = $('style')
    .map((_, el) => $(el).html())
    .get()
    .join('\n')
    .replace(/url\(\s*['"]?data:[^)]*\)/gi, 'url(...)')
    .slice(0, LIMIT.css);

  // (b) 템플릿 제작자가 남긴 작업 지시 주석
  const guide = collectComments($)
    .map(commentText)
    .filter((t) => t.length > 40)
    .join('\n\n')
    .slice(0, LIMIT.guide);

  // (c) 본문 골격 — 이미지 data URI 축약
  const skeleton = ($paper.html() || '')
    .replace(/(src=")data:[^"]*(")/gi, '$1data:image/png;base64,...$2')
    .slice(0, LIMIT.skeleton);

  const title = (
    $('#paper h1').first().text() ||
    $('h1').first().text() ||
    $('title').first().text() ||
    filename
  )
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200);

  return { css, skeleton, guide, title, hasPaper };
}

/**
 * 문서 하단의 제작·배포 출처 표기(.source-credit)와 그에 딸린 CSS 규칙을 제거한다.
 * 원본 템플릿 파일은 건드리지 않고, 내보낼 때만 걷어낸다.
 */
function stripBranding($: CheerioApi): void {
  $('.source-credit').remove();

  // 출처 표기를 "유지하라"고 지시하는 주석도 함께 제거 (이제 유효하지 않음)
  for (const c of collectComments($)) {
    if (/source-credit/i.test(commentText(c))) $(c).remove();
  }

  $('style').each((_, el) => {
    const before = $(el).html() || '';
    const after = before
      // .source-credit{...}, .source-credit img{...}, @media print 안의 규칙까지
      .replace(/\.source-credit[^{}]*\{[^{}]*\}/g, '')
      // 규칙이 빠져 비어 버린 @media 블록 정리
      .replace(/@media[^{}]*\{\s*\}/g, '')
      .trim();
    if (after !== before) $(el).html(after);
  });
}

/** 템플릿 원본을 미리보기용으로 내보낼 때 쓰는 래퍼 */
export function stripBrandingFromHtml(html: string): string {
  const $ = cheerio.load(html);
  stripBranding($);
  return '<!DOCTYPE html>\n' + $.html();
}

/**
 * AI가 생성한 본문 조각을 템플릿의 #paper 안에 끼워 넣어 완성본을 만든다.
 * 템플릿의 CSS·스크립트·인쇄 규칙은 그대로 보존된다.
 */
export function assemble(templateHtml: string, bodyHtml: string): { html: string; title: string } {
  const $ = cheerio.load(templateHtml);
  const $paper = $('#paper').length ? $('#paper') : $('body');

  $paper.html(bodyHtml);
  stripBranding($);

  // 템플릿 사용 안내(.hint)와 제작 지시 주석은 완성본에서 제거
  $('.hint').remove();
  for (const c of collectComments($)) {
    if (/GPT|작성 지시|작업 지시문/i.test(commentText(c))) $(c).remove();
  }

  // 생성된 h1 을 <title> 및 툴바 제목과 동기화
  const h1 = $paper.find('h1').first().text().trim().replace(/\s+/g, ' ');
  if (h1) {
    if ($('title').length) $('title').text(h1);
    else $('head').append(`<title>${h1}</title>`);
    const $tt = $('#toolbar .t-title');
    if ($tt.length) $tt.text(h1);
  }

  return { html: '<!DOCTYPE html>\n' + $.html(), title: h1 };
}

/**
 * 모델이 코드펜스나 전체 문서로 감싸 응답한 경우를 정리해
 * #paper 안에 넣을 조각만 남긴다.
 */
export function cleanFragment(text: string): string {
  let s = String(text).trim();
  s = s.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();

  const paper = s.match(/<div[^>]+id=["']paper["'][^>]*>([\s\S]*)<\/div>\s*$/i);
  if (paper) return paper[1].trim();

  const body = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) return body[1].trim();

  return s;
}
