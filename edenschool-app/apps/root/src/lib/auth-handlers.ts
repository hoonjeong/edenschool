import { randomInt } from 'crypto';
import { normalizePhone } from '@edenschool/common/validation';
import { sendSms, isSmsSuccess } from '@edenschool/common/sms';
import {
  getVerification,
  setVerification,
  markVerified,
  incrementAttempts,
} from '@/lib/verification-store';

// ── verify-phone ────────────────────────────────────────────────

export type VerifyPhoneResult =
  | { status: 'empty' }
  | { status: 'no_request' }
  | { status: 'wrong' }
  | { status: 'ok'; studentId?: number };

export function handleVerifyPhone(
  prefix: string,
  rawPhone: string,
  code: string,
): VerifyPhoneResult {
  if (!code || !rawPhone) {
    return { status: 'empty' };
  }

  const phone = normalizePhone(rawPhone);
  const entry = getVerification(prefix, phone);

  if (!entry) {
    return { status: 'no_request' };
  }

  if (code !== entry.code) {
    incrementAttempts(prefix, phone);
    return { status: 'wrong' };
  }

  markVerified(prefix, phone);
  return { status: 'ok', studentId: entry.studentId };
}

// ── send-verification-sms ───────────────────────────────────────

export interface SendVerificationSmsOptions {
  prefix: string;
  phone: string;
  studentId?: number;
  adminMode?: boolean;
  callNum?: string;
}

export type SendSmsResult =
  | { status: 'ok' }
  | { status: 'sms_fail' };

export async function sendVerificationSms(
  options: SendVerificationSmsOptions,
): Promise<SendSmsResult> {
  const { prefix, phone, studentId, adminMode, callNum } = options;

  const code = String(randomInt(100000, 1000000));
  const smsPrefix = process.env.SMS_PREFIX || '[이든배움국어학원]';
  const message = adminMode
    ? `${smsPrefix} 관리자\n인증번호를 확인해주세요. [${code}]`
    : `${smsPrefix}\n인증번호를 확인해주세요. [${code}]`;

  const result = await sendSms('SMS', phone, message, callNum);
  if (!isSmsSuccess(result)) {
    return { status: 'sms_fail' };
  }

  setVerification(prefix, phone, code, studentId);
  return { status: 'ok' };
}
