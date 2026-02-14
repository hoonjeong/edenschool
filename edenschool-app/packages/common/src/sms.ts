import pool from './db';

export async function sendSms(type: string, phone: string, message: string, callNum = process.env.SMS_DEFAULT_CALLNUM || '', sendId = 0): Promise<string | null> {
  if (!process.env.SMS_USER_ID || !process.env.SMS_AUTH_KEY) {
    console.error('SMS credentials not configured.');
    return null;
  }

  const smsApiUrl = process.env.SMS_API_URL || 'https://apis.aligo.in/send/';

  const params = new URLSearchParams({
    key: process.env.SMS_AUTH_KEY,
    user_id: process.env.SMS_USER_ID,
    sender: callNum.replace(/-/g, ''),
    receiver: phone.replace(/-/g, ''),
    msg: message,
    msg_type: type,
  });

  let resultString: string | null = null;

  try {
    const response = await fetch(smsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

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
