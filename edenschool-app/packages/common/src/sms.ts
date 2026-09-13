import pool from './db';

/** MMS 첨부 이미지 (알리고: image/image1~image3, JPEG·PNG·GIF, 최대 3장) */
export interface SmsImage {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export const MMS_MAX_IMAGES = 3;
export const MMS_MAX_IMAGE_BYTES = 300 * 1024; // 알리고 권장 상한 (장당 300KB)
export const MMS_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif'];

export interface SendSmsOptions {
  /** MMS 첨부 이미지 (type이 'MMS'일 때만 사용) */
  images?: SmsImage[];
  /** LMS/MMS 제목 (1~44 byte, 선택) */
  title?: string;
}

export async function sendSms(
  type: string,
  phone: string,
  message: string,
  callNum = process.env.SMS_DEFAULT_CALLNUM || '',
  sendId = 0,
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

  let resultString: string | null = null;

  try {
    const response = await fetch(smsApiUrl, { method: 'POST', headers, body });

    resultString = await response.text();

    // Log SMS result to sms_send_result_renew
    await pool.query(
      `INSERT INTO sms_send_result_renew (send_id, phone, message, type, result_message, send_time) VALUES (?,?,?,?,?,now())`,
      [sendId, phone, message, type, resultString]
    );
  } catch (e) {
    console.error('SMS send error:', e);
  }

  return resultString;
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
