// Claude API 오류를 선생님이 바로 이해할 수 있는 한글 안내로 바꾼다.
// SDK 기본 message는 `400 {"type":"error",...}` 처럼 영문 JSON이 그대로 붙어 있어
// 화면에 노출되면 "글씨를 못 읽었다"로 오해하기 쉽다. 원인별로 다르게 안내한다.

export type AiErrorKind =
  | "credit" // 크레딧 소진 (결제 문제)
  | "billing" // 결제수단 오류 (402)
  | "spendLimit" // 직접 설정한 사용 한도 도달(400) / 조직 월 상한 도달(429)
  | "auth" // API 키 오류
  | "permission" // 키 권한 없음
  | "notFound" // 모델명 오류
  | "tooLarge" // 요청(이미지) 용량 초과
  | "rateLimit" // 요청 한도 초과
  | "overloaded" // AI 서버 과부하·장애
  | "network" // 네트워크 연결 실패
  | "unknown";

export interface AiErrorInfo {
  kind: AiErrorKind;
  /** 화면에 그대로 보여줄 한글 안내 */
  message: string;
  /** 같은 이미지로 다시 시도하면 될 만한 오류인지 */
  retryable: boolean;
  /** 원인이 서비스 설정·결제라서 선생님이 손쓸 수 없는 오류인지 */
  needsAdmin: boolean;
}

interface AnyErr {
  status?: number;
  message?: string;
  name?: string;
  error?: { error?: { type?: string; message?: string } };
  cause?: unknown;
}

/** SDK 오류 본문에서 사람이 읽을 영문 메시지만 뽑아 낸다. */
function rawMessage(e: AnyErr): string {
  const fromBody = e.error?.error?.message;
  if (typeof fromBody === "string" && fromBody) return fromBody;

  const m = typeof e.message === "string" ? e.message : "";
  const brace = m.indexOf("{");
  if (brace >= 0) {
    try {
      const o = JSON.parse(m.slice(brace)) as { error?: { message?: string }; message?: string };
      const inner = o?.error?.message ?? o?.message;
      if (typeof inner === "string" && inner) return inner;
    } catch {
      // JSON이 아니면 원문 그대로 쓴다.
    }
  }
  return m;
}

export function classifyAiError(e: unknown): AiErrorInfo {
  const err = (e ?? {}) as AnyErr;
  const status = typeof err.status === "number" ? err.status : undefined;
  const type = err.error?.error?.type ?? "";
  const raw = rawMessage(err);
  const low = raw.toLowerCase();

  const info = (kind: AiErrorKind, message: string, retryable: boolean, needsAdmin: boolean): AiErrorInfo => ({
    kind,
    message,
    retryable,
    needsAdmin,
  });

  if (low.includes("credit balance") || low.includes("billing")) {
    return info(
      "credit",
      "AI 사용 크레딧이 부족합니다. 손글씨 인식 문제가 아니라 결제 문제입니다. Anthropic 콘솔의 Plans & Billing에서 크레딧을 충전한 뒤 다시 시도해 주세요.",
      false,
      true,
    );
  }
  if (status === 402 || type === "billing_error") {
    return info(
      "billing",
      "결제 정보에 문제가 있어 AI를 호출하지 못했습니다. Anthropic 콘솔의 Billing에서 카드·결제수단을 확인해 주세요.",
      false,
      true,
    );
  }
  // 콘솔에서 지정한 사용 한도(400) 또는 조직 티어의 월 상한(429). 크레딧 부족과는 다른 상황이다.
  if (low.includes("usage limit") || low.includes("usage threshold") || low.includes("spend limit")) {
    return info(
      "spendLimit",
      "설정된 API 사용 한도에 도달해 이번 달 호출이 중지되었습니다. Anthropic 콘솔의 Billing에서 한도를 올리거나 해제해 주세요.",
      false,
      true,
    );
  }
  if (status === 401 || type === "authentication_error" || low.includes("invalid x-api-key")) {
    return info("auth", "AI API 키가 올바르지 않습니다(ANTHROPIC_API_KEY). 관리자에게 키 확인을 요청해 주세요.", false, true);
  }
  if (status === 403 || type === "permission_error") {
    return info("permission", "이 API 키로는 해당 AI 모델을 사용할 수 없습니다. 관리자에게 문의해 주세요.", false, true);
  }
  if (status === 404 || type === "not_found_error") {
    return info("notFound", "AI 모델을 찾을 수 없습니다(모델 설정 확인 필요). 관리자에게 문의해 주세요.", false, true);
  }
  if (status === 413 || type === "request_too_large" || low.includes("too large")) {
    return info(
      "tooLarge",
      "이미지 용량이 한 번에 보낼 수 있는 크기를 넘었습니다. 장수를 줄여 나눠 인식하거나, 사진을 다시 찍어 올려 주세요.",
      true,
      false,
    );
  }
  if (status === 429 || type === "rate_limit_error") {
    return info("rateLimit", "AI 요청이 잠시 몰렸습니다. 1~2분 뒤에 '다시 인식'을 눌러 주세요.", true, false);
  }
  if (status === 529 || type === "overloaded_error" || (status != null && status >= 500)) {
    return info("overloaded", "AI 서버가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.", true, false);
  }
  if (
    err.name === "APIConnectionError" ||
    err.name === "APIConnectionTimeoutError" ||
    low.includes("fetch failed") ||
    low.includes("econnreset") ||
    low.includes("etimedout") ||
    low.includes("timeout")
  ) {
    return info("network", "AI 서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.", true, false);
  }
  return info("unknown", raw, true, false);
}

/** 화면 노출용 한글 문구. 분류되지 않은 오류는 fallback으로 대체한다. */
export function describeAiError(e: unknown, fallback: string): string {
  const info = classifyAiError(e);
  if (info.kind === "unknown") {
    const raw = info.message.trim();
    // 영문 JSON 덩어리가 남아 있으면 보여 주지 않는다.
    if (!raw || raw.startsWith("{") || raw.length > 200) return fallback;
    return `${raw} ${fallback}`.trim();
  }
  return info.message;
}
