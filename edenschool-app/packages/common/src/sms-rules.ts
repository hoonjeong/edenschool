/**
 * 문자 발송 "규칙"만 모은 모듈 — 화면(클라이언트)과 서버가 함께 쓴다.
 *
 * ⚠ 이 파일은 **DB·Node 전용 모듈을 import 하지 않는다.**
 *   sms.ts 는 db.ts(mysql2)를 쓰기 때문에 클라이언트 컴포넌트가 거기서 import 하면
 *   mysql2 가 브라우저 번들로 끌려와 빌드가 깨진다. 그래서 순수 규칙은 여기 둔다.
 *
 * 학원 화면(SmsComposer)과 교육원 화면(notices-client)이 같은 값을 쓰도록
 * 바이트 계산·발송 종류 판정·MMS 제약·실패 안내를 한곳에서 정의한다.
 * 발송 규칙이 바뀌면 이 파일만 고치면 양쪽에 동시에 반영된다.
 */

/** MMS 첨부 이미지 (알리고: image/image1~image3, JPEG·PNG·GIF, 최대 3장) */
export interface SmsImage {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface SendSmsOptions {
  /** MMS 첨부 이미지 (type이 'MMS'일 때만 사용) */
  images?: SmsImage[];
  /** LMS/MMS 제목 (1~44 byte, 선택) */
  title?: string;
}

export type SmsType = 'SMS' | 'LMS' | 'MMS';

export const MMS_MAX_IMAGES = 3;
export const MMS_MAX_IMAGE_BYTES = 300 * 1024; // 알리고 권장 상한 (장당 300KB)
export const MMS_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif'];

/** SMS(단문) 최대 byte. 이 값을 넘으면 LMS(장문)로 나간다. */
export const SMS_SINGLE_MAX_BYTES = 90;
/** LMS/MMS 본문 최대 byte. */
export const SMS_MAX_BYTES = 2000;

/**
 * 알리고 과금 기준 byte 길이 (한글 2, 그 외 1).
 * 브라우저·서버 양쪽에서 같은 값이 나와야 해서 Buffer 를 쓰지 않는다.
 * 예전엔 학원(encodeURIComponent 방식)과 교육원(Buffer.byteLength)이 서로 다른
 * 값을 계산해, 같은 문장이 한쪽은 SMS 다른 쪽은 LMS 로 나갔다.
 */
export function smsByteLength(message: string): number {
  let bytes = 0;
  for (const ch of message) {
    bytes += ch.charCodeAt(0) > 0x7f ? 2 : 1;
  }
  return bytes;
}

/** 본문 길이와 이미지 첨부 여부로 발송 종류를 정한다. */
export function detectSmsType(message: string, hasImages = false): SmsType {
  if (hasImages) return 'MMS';
  return smsByteLength(message) <= SMS_SINGLE_MAX_BYTES ? 'SMS' : 'LMS';
}

/** 알리고 응답이 성공(result_code > 0)인지 판정 */
export function isSmsSuccess(result: string | null): boolean {
  if (!result) return false;
  try {
    const parsed = JSON.parse(result);
    return Number(parsed.result_code) > 0;
  } catch {
    return false;
  }
}

/** 알리고 응답에서 사람이 읽을 실패 사유를 뽑아낸다. (예: 등록되지 않은 발신번호) */
export function smsFailureReason(result: string | null): string {
  if (!result) return '응답 없음';
  try {
    const parsed = JSON.parse(result);
    const code = parsed.result_code;
    const msg = parsed.message || '알 수 없는 오류';
    return code === undefined ? String(msg) : `[${code}] ${msg}`;
  } catch {
    return result.slice(0, 200);
  }
}

/**
 * 실패 사유가 '발신번호 미등록(-103)' 계열인지.
 * 이 경우 코드로는 손쓸 수 없고 알리고에 발신번호를 등록해야 하므로,
 * 양쪽 화면에서 동일한 안내 문구를 띄우는 데 쓴다.
 */
export function isSenderNotRegistered(reason: string | null | undefined): boolean {
  return !!reason && /발신번호|-103/.test(reason);
}

/** 발신번호 미등록일 때 화면에 덧붙일 안내 문구. */
export const SENDER_NOT_REGISTERED_HINT =
  '※ 알리고에 등록되지 않은 발신번호로 보입니다. 발신번호 등록 여부를 확인해주세요.';
