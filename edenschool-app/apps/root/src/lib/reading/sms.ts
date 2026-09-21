import { prisma } from "./prisma";
import {
  callSmsApi,
  isSmsSuccess,
  smsFailureReason,
  detectSmsType,
  smsByteLength,
  MMS_MAX_IMAGES,
  MMS_MAX_IMAGE_BYTES,
  MMS_ALLOWED_MIME,
  SMS_MAX_BYTES,
  type SmsImage,
} from "@edenschool/common/sms";

// 독서교육원 문자 발송
//
// 알리고 호출 자체는 packages/common 의 callSmsApi() 를 그대로 쓴다.
// 예전에는 이 파일이 알리고 호출 로직을 통째로 복제하고 있었는데, 공용 쪽이 개선돼도
// 반영되지 않아 MMS·네트워크 오류 처리가 빠진 채로 남아 있었다.
// 이 파일이 따로 갖는 책임은 **로그를 edenbooks DB(Prisma)에 남기는 것** 하나뿐이다.
// (학원은 edenschool DB 의 sms_send_result_renew, 교육원은 edenbooks 의 SmsLog)

export type SmsType = "SMS" | "LMS" | "MMS";

export { isSmsSuccess, smsFailureReason, MMS_MAX_IMAGES, MMS_MAX_IMAGE_BYTES, MMS_ALLOWED_MIME, SMS_MAX_BYTES, smsByteLength };
export type { SmsImage };

export interface SendResult {
  ok: boolean;
  raw: string;
  dryRun: boolean;
  /** 실패 시 사람이 읽을 사유 (예: [-103] 등록/인증되지 않은 발신번호입니다.) */
  reason?: string;
}

const SMS_PREFIX = process.env.SMS_PREFIX ?? "[이든국어독서교육원]";

// 독서교육원 문자 발신번호 — 교육원 전용 번호로 고정한다.
// SMS_DEFAULT_CALLNUM(본관 번호)을 쓰지 않으므로 .env 설정과 무관하게 항상 이 번호로 나간다.
// ※ 알리고에 사전등록된 발신번호여야 실제 발송이 성공한다.
const READING_CALLNUM = "010-5236-6362";

/** 메시지 길이·이미지 첨부 여부로 SMS/LMS/MMS 판별 — 학원 화면과 같은 규칙을 쓴다. */
export const detectType = detectSmsType;

export function withPrefix(message: string): string {
  return message.startsWith(SMS_PREFIX) ? message : `${SMS_PREFIX} ${message}`;
}

/**
 * data URL(`data:image/jpeg;base64,...`) 을 알리고 첨부 형식으로 바꾼다.
 * /reading 의 서버 액션은 이미지를 data URL 로 주고받는 관례를 쓴다(첨삭 답안과 동일).
 * 형식·용량 위반은 여기서 걸러 호출자에게 알린다.
 */
export function dataUrlToSmsImage(dataUrl: string, index = 0): SmsImage {
  const m = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("이미지 형식을 읽을 수 없습니다.");
  const [, mimeType, b64] = m;
  if (!MMS_ALLOWED_MIME.includes(mimeType)) {
    throw new Error("JPG, PNG, GIF 이미지만 첨부할 수 있습니다.");
  }
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MMS_MAX_IMAGE_BYTES) {
    throw new Error(`이미지 용량은 장당 ${Math.floor(MMS_MAX_IMAGE_BYTES / 1024)}KB 이하여야 합니다.`);
  }
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/gif" ? "gif" : "jpg";
  return { buffer, filename: `image${index + 1}.${ext}`, mimeType };
}

export async function sendSms(opts: {
  phone: string;
  message: string;
  type?: SmsType;
  title?: string;
  sendId?: number;
  templateId?: number;
  images?: SmsImage[];
}): Promise<SendResult> {
  const type = opts.type ?? detectSmsType(opts.message, !!opts.images?.length);
  const phone = opts.phone.replace(/-/g, "");

  // 자격증명 미설정이면 callSmsApi 가 null 을 돌려준다 → 드라이런으로 처리
  const raw =
    (await callSmsApi(type, phone, opts.message, READING_CALLNUM, {
      title: opts.title,
      images: opts.images,
    })) ??
    JSON.stringify({ result_code: 1, message: "success (dry-run: 자격증명 미설정)", dryRun: true });

  const dryRun = raw.includes('"dryRun":true');
  const ok = isSmsSuccess(raw);

  // 발송 결과 로그 저장 (edenbooks DB)
  try {
    await prisma.smsLog.create({
      data: {
        sendId: opts.sendId ?? 0,
        phone,
        message: opts.message,
        type,
        title: opts.title ?? null,
        resultMessage: raw,
        success: ok,
        templateId: opts.templateId ?? null,
      },
    });
  } catch (e) {
    console.error("SmsLog insert error:", e);
  }

  return ok ? { ok, raw, dryRun } : { ok, raw, dryRun, reason: smsFailureReason(raw) };
}

/** 실패한 건 하나 — 화면에서 번호를 복사해 수동 재발송하는 데 쓴다. */
export interface BulkFailure {
  phone: string;
  /** 학생 이름 등 화면 표시용 (발송에는 쓰지 않는다) */
  name?: string;
  reason?: string;
}

export interface BulkResult {
  total: number;
  success: number;
  failed: number;
  dryRun: boolean;
  /** 대표 실패 사유 1건 (대부분 같은 원인이라 요약용) */
  failReason?: string;
  /** 건별 실패 목록. "2건 실패"만으로는 어느 번호인지 알 수 없어 따로 돌려준다. */
  failures: BulkFailure[];
}

/** 대량 발송 — 개인별 치환된 메시지 배열을 순차 발송 */
export async function sendBulk(
  items: { phone: string; message: string; title?: string; name?: string }[],
  opts: { sendId?: number; templateId?: number; images?: SmsImage[] } = {},
): Promise<BulkResult> {
  let success = 0;
  let dryRun = false;
  let failReason: string | undefined;
  const failures: BulkFailure[] = [];

  for (const it of items) {
    const { name, ...sendArgs } = it;
    const r = await sendSms({ ...sendArgs, ...opts });
    if (r.ok) {
      success++;
    } else {
      failReason ??= r.reason;
      failures.push({ phone: it.phone, name, reason: r.reason });
    }
    dryRun = r.dryRun;
  }

  const failed = items.length - success;
  if (failed > 0) {
    // 발신번호 미등록처럼 전량 실패하는 경우가 있어 서버 로그에도 남긴다.
    console.error(`독서교육원 문자 실패 ${failed}/${items.length}건 (발신번호 ${READING_CALLNUM}):`, failReason);
  }

  return { total: items.length, success, failed, dryRun, failReason, failures };
}
