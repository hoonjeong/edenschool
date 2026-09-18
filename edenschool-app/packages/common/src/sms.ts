import pool from './db';

// 발송 규칙(바이트 계산·종류 판정·MMS 제약·실패 안내)은 sms-rules.ts 에 모여 있다.
// 이 파일은 db.ts(mysql2)를 쓰기 때문에 클라이언트 컴포넌트가 직접 import 할 수 없다.
// 화면에서는 '@edenschool/common/sms-rules' 를 쓸 것.
import { MMS_MAX_IMAGES, type SendSmsOptions } from './sms-rules';

export * from './sms-rules';

export async function callSmsApi(
  type: string,
  phone: string,
  message: string,
  callNum = process.env.SMS_DEFAULT_CALLNUM || '',
  options: SendSmsOptions = {}
): Promise<string | null> {
  if (!process.env.SMS_USER_ID || !process.env.SMS_AUTH_KEY) {
    console.error('SMS credentials not configured.');
    return null;
  }

  const smsApiUrl = process.env.SMS_API_URL || 'https://apis.aligo.in/send/';

  const fields: Record<string, string> = {
    key: process.env.SMS_AUTH_KEY,
    user_id: process.env.SMS_USER_ID,
    sender: callNum.replace(/-/g, ''),
    receiver: phone.replace(/-/g, ''),
    msg: message,
    msg_type: type,
  };
  if (options.title && type !== 'SMS') {
    fields.title = options.title;
  }

  const images = type === 'MMS' ? (options.images || []).slice(0, MMS_MAX_IMAGES) : [];

  // 이미지가 있으면 multipart/form-data, 없으면 기존과 동일하게 urlencoded 전송
  let body: BodyInit;
  let headers: Record<string, string> | undefined;
  if (images.length > 0) {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    images.forEach((img, i) => {
      // 알리고 파라미터명: image (=image1), image2, image3
      const name = i === 0 ? 'image' : `image${i + 1}`;
      form.append(name, new Blob([new Uint8Array(img.buffer)], { type: img.mimeType }), img.filename);
    });
    body = form; // Content-Type(boundary 포함)은 fetch가 자동 설정
  } else {
    body = new URLSearchParams(fields).toString();
    headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  }

  try {
    const response = await fetch(smsApiUrl, { method: 'POST', headers, body });
    return await response.text();
  } catch (e) {
    console.error('SMS send error:', e);
    // 네트워크 단계에서 터져도 호출자가 이력을 남길 수 있도록 실패 응답을 만들어 준다.
    // 예전엔 여기서 예외를 삼켜 로그가 아예 안 남았고, "보낸 적 없는 문자"가 됐다.
    return JSON.stringify({
      result_code: -99,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * 학원(edenschool) 문자 발송 — 알리고 호출 + sms_send_result_renew 에 이력 기록.
 * 독서교육원은 로그 DB 가 달라 callSmsApi() 를 직접 쓴다.
 */
export async function sendSms(
  type: string,
  phone: string,
  message: string,
  callNum = process.env.SMS_DEFAULT_CALLNUM || '',
  sendId = 0,
  options: SendSmsOptions = {}
): Promise<string | null> {
  const resultString = await callSmsApi(type, phone, message, callNum, options);
  if (resultString === null) return null;

  try {
    await pool.query(
      `INSERT INTO sms_send_result_renew (send_id, phone, message, type, result_message, send_time) VALUES (?,?,?,?,?,now())`,
      [sendId, phone, message, type, resultString]
    );
  } catch (e) {
    console.error('SMS log insert error:', e);
  }

  return resultString;
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

/** Check if Aligo API response indicates success (result_code > 0) */
export function isSmsSuccess(result: string | null): boolean {
  if (!result) return false;
  try {
    const parsed = JSON.parse(result);
    return parsed.result_code > 0;
  } catch {
    return false;
  }
}
