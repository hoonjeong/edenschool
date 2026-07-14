import { prisma } from "./prisma";

// 알리고(Aligo) 문자 발송 — edenschool 방식 참고, 본 프로젝트 독립 구현
// 자격증명(SMS_USER_ID / SMS_AUTH_KEY) 미설정 시 드라이런(모의 발송)으로 동작한다.

export type SmsType = "SMS" | "LMS" | "MMS";

export interface SendResult {
  ok: boolean;
  raw: string;
  dryRun: boolean;
}

const SMS_PREFIX = process.env.SMS_PREFIX ?? "[이든국어독서교육원]";

/** 메시지 길이에 따라 SMS(단문)/LMS(장문) 자동 판별 (UTF-8 90byte 기준) */
export function detectType(message: string): SmsType {
  const bytes = Buffer.byteLength(message, "utf8");
  return bytes <= 90 ? "SMS" : "LMS";
}

export function withPrefix(message: string): string {
  return message.startsWith(SMS_PREFIX) ? message : `${SMS_PREFIX} ${message}`;
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

export async function sendSms(opts: {
  phone: string;
  message: string;
  type?: SmsType;
  title?: string;
  callNum?: string;
  sendId?: number;
  templateId?: number;
}): Promise<SendResult> {
  const type = opts.type ?? detectType(opts.message);
  const callNum = (opts.callNum ?? process.env.SMS_DEFAULT_CALLNUM ?? "").replace(/-/g, "");
  const phone = opts.phone.replace(/-/g, "");
  const message = opts.message;

  const configured = !!(process.env.SMS_USER_ID && process.env.SMS_AUTH_KEY);
  let raw = "";
  let ok = false;

  if (!configured) {
    // ── 드라이런: 실제 발송하지 않고 성공한 것처럼 처리 ──
    raw = JSON.stringify({
      result_code: 1,
      message: "success (dry-run: 자격증명 미설정)",
      dryRun: true,
    });
    ok = true;
  } else {
    const smsApiUrl = process.env.SMS_API_URL || "https://apis.aligo.in/send/";
    const params = new URLSearchParams({
      key: process.env.SMS_AUTH_KEY!,
      user_id: process.env.SMS_USER_ID!,
      sender: callNum,
      receiver: phone,
      msg: message,
      msg_type: type,
    });
    if (opts.title && (type === "LMS" || type === "MMS")) {
      params.set("title", opts.title.slice(0, 40));
    }
    try {
      const res = await fetch(smsApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      raw = await res.text();
      ok = isSmsSuccess(raw);
    } catch (e) {
      raw = JSON.stringify({ result_code: -99, message: String(e) });
      ok = false;
    }
  }

  // 발송 결과 로그 저장
  await prisma.smsLog.create({
    data: {
      sendId: opts.sendId ?? 0,
      phone,
      message,
      type,
      title: opts.title ?? null,
      resultMessage: raw,
      success: ok,
      templateId: opts.templateId ?? null,
    },
  });

  return { ok, raw, dryRun: !configured };
}

/** 대량 발송 — 개인별 치환된 메시지 배열을 순차 발송 */
export async function sendBulk(
  items: { phone: string; message: string; title?: string }[],
  opts: { sendId?: number; templateId?: number } = {},
): Promise<{ total: number; success: number; dryRun: boolean }> {
  let success = 0;
  let dryRun = false;
  for (const it of items) {
    const r = await sendSms({ ...it, ...opts });
    if (r.ok) success++;
    dryRun = r.dryRun;
  }
  return { total: items.length, success, dryRun };
}
