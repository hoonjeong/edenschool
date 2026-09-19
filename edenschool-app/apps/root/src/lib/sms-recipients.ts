// 문자 발송 대상 번호 파싱 — 「번호로 발송」(붙여넣기)과 「엑셀로 발송」이 함께 쓴다.
// DB·서버 의존이 없어 클라이언트 컴포넌트에서도 import 할 수 있다.

/** 발송 가능한 휴대폰 번호 (하이픈 제거 후) */
const MOBILE_RE = /^01[016789]\d{7,8}$/;

export interface ParsedRecipient {
  phone: string; // 정규화된 번호(숫자만)
  name?: string; // 엑셀의 이름 열 등 표시용
  source: string; // 원본 문자열 (오류 안내용)
  row?: number; // 엑셀 행 번호
}

export interface RecipientParseResult {
  valid: ParsedRecipient[]; // 중복 제거된 발송 대상
  invalid: ParsedRecipient[]; // 번호 형식이 아닌 항목
  duplicates: number; // 중복으로 제거된 건수
}

/**
 * 셀·토큰 하나를 휴대폰 번호로 정규화한다. 번호가 아니면 null.
 * - 하이픈·공백·괄호 등 숫자 외 문자는 제거
 * - 엑셀이 숫자로 저장해 앞 0 이 빠진 경우(1012345678) 0 을 붙여 복구
 * - 국가번호 82 로 시작하면(+82 10 ...) 0 으로 치환
 */
export function normalizeRecipientPhone(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('82') && digits.length >= 11) digits = '0' + digits.slice(2);
  if (/^1[016789]\d{7,8}$/.test(digits)) digits = '0' + digits;
  return MOBILE_RE.test(digits) ? digits : null;
}

/** 같은 번호는 한 번만 보내도록 정리하고, 형식이 틀린 항목은 따로 모은다. */
export function dedupeRecipients(items: ParsedRecipient[]): RecipientParseResult {
  const seen = new Set<string>();
  const valid: ParsedRecipient[] = [];
  const invalid: ParsedRecipient[] = [];
  let duplicates = 0;
  for (const item of items) {
    if (!item.phone) {
      invalid.push(item);
      continue;
    }
    if (seen.has(item.phone)) {
      duplicates += 1;
      continue;
    }
    seen.add(item.phone);
    valid.push(item);
  }
  return { valid, invalid, duplicates };
}

/**
 * 텍스트 영역에 붙여넣은 번호 목록을 분리한다.
 * 쉼표·개행·세미콜론·탭 기준으로 나눈다. 공백은 "010 1234 5678" 처럼 번호 안에
 * 들어갈 수 있어 구분자로 쓰지 않는다.
 */
export function parseRecipientText(text: string): RecipientParseResult {
  const tokens = text
    .split(/[,\n\r;\t]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const items: ParsedRecipient[] = tokens.map((token) => ({
    phone: normalizeRecipientPhone(token) ?? '',
    source: token,
  }));
  return dedupeRecipients(items);
}

/** 엑셀 머리글이 "번호" 열인지 */
export function isPhoneHeader(text: string): boolean {
  return /번호|연락처|전화|휴대폰|핸드폰|phone|mobile/i.test(text);
}

/** 엑셀 머리글이 "이름" 열인지 */
export function isNameHeader(text: string): boolean {
  return /이름|성명|name/i.test(text);
}

/** 샘플 양식의 예시 행(발송 제외) */
export function isExampleRow(text: string): boolean {
  return /^\(?예\)/.test(text.trim());
}
