"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import type { GenInput, GenOutput } from "@/lib/reading/correction-config";
import { getEdenPhilosophy } from "@/lib/reading/settings";
import { hasClaudeKey } from "@/lib/reading/claude";
import { recognizeImageWithClaude, analyzeAnswerWithClaude } from "@/lib/reading/correction-ai";
import { requireSession } from "@/lib/reading/session";
import { classifyAiError } from "@/lib/reading/ai-error";
import {
  saveCorrectionImages,
  deleteCorrectionImages,
  MAX_CORRECTION_IMAGES,
} from "@/lib/reading/correction-images";

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

/** Claude 호출 실패를 원인별 한글 안내로 바꾼다. 원문 영문 JSON은 화면에 내보내지 않는다. */
function aiFailure(e: unknown, fallback: string) {
  const info = classifyAiError(e);
  const message = info.kind === "unknown" ? errorMessage(e, fallback) : info.message;
  return {
    ok: false as const,
    error: message.startsWith("{") || message.length > 200 ? fallback : message,
    retryable: info.retryable,
    needsAdmin: info.needsAdmin,
  };
}

// ── ② 답안 이미지 인식 (Claude 비전 OCR) ──
// 실패하면 실패라고 알린다. 예시 답안으로 대체하지 않는다.
export type RecognizeResult =
  | { ok: true; problem: string; answer: string }
  | { ok: false; error: string; retryable?: boolean; needsAdmin?: boolean };

export async function recognizeImage(dataUrls: string[]): Promise<RecognizeResult> {
  await requireSession();

  const imgs = (dataUrls ?? []).filter(Boolean);
  if (imgs.length === 0) {
    return { ok: false, error: "인식할 답안 이미지가 없습니다. 이미지를 먼저 올려 주세요.", retryable: false };
  }
  if (imgs.length > MAX_CORRECTION_IMAGES) {
    return { ok: false, error: `이미지는 최대 ${MAX_CORRECTION_IMAGES}장까지 인식할 수 있습니다.`, retryable: false };
  }
  if (!hasClaudeKey()) {
    return {
      ok: false,
      error:
        "AI 인식 기능이 설정되어 있지 않습니다(ANTHROPIC_API_KEY 미설정). 관리자에게 문의하시거나 '직접 입력'으로 진행해 주세요.",
      retryable: false,
      needsAdmin: true,
    };
  }

  try {
    const r = await recognizeImageWithClaude(imgs);
    if (!r.answer.trim()) {
      return {
        ok: false,
        error:
          "이미지에서 학생 답안을 찾지 못했습니다. 사진이 흐리거나 글씨가 잘렸는지 확인해 다시 촬영하거나, '직접 입력'으로 진행해 주세요.",
        retryable: true,
      };
    }
    return { ok: true, problem: r.problem, answer: r.answer };
  } catch (e) {
    console.error("Claude OCR 실패:", e);
    return aiFailure(e, "알 수 없는 이유로 인식하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

// ── ⑤ 첨삭 실행 (미저장, 미리보기용) ──
// 실패하면 실패라고 알린다. 가짜 분석지를 만들어 내지 않는다.
export type RunCorrectionResult =
  | ({ ok: true } & GenOutput)
  | { ok: false; error: string; retryable?: boolean; needsAdmin?: boolean };

export async function runCorrection(
  input: Omit<GenInput, "edenDirection"> & { edenDirection?: string },
): Promise<RunCorrectionResult> {
  await requireSession();

  if (!input.answerText?.trim()) {
    return { ok: false, error: "학생 답안이 비어 있습니다. 인식 결과를 확인·입력한 뒤 진행해 주세요.", retryable: false };
  }
  if (!hasClaudeKey()) {
    return {
      ok: false,
      error: "AI 첨삭 기능이 설정되어 있지 않습니다(ANTHROPIC_API_KEY 미설정). 관리자에게 문의해 주세요.",
      retryable: false,
      needsAdmin: true,
    };
  }

  const edenDirection = input.edenDirection?.trim() || (await getEdenPhilosophy());

  try {
    const out = await analyzeAnswerWithClaude({ ...input, edenDirection });
    return { ok: true, ...out };
  } catch (e) {
    console.error("Claude 첨삭 실패:", e);
    return aiFailure(e, "알 수 없는 이유로 첨삭하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

// ── 저장 ──
export async function saveCorrection(input: {
  studentId: number | null;
  title: string;
  genre: string;
  gradeLevel: string;
  tone: string;
  metrics: string[];
  custom?: string;
  problemText: string;
  answerText: string;
  resultText: string;
  summary: string;
  scores: Record<string, number>;
  images?: string[]; // 원본 답안 이미지 data URL
}) {
  await requireSession();

  const c = await prisma.correction.create({
    data: {
      studentId: input.studentId,
      title: input.title || "첨삭",
      genre: input.genre,
      gradeLevel: input.gradeLevel,
      options: { tone: input.tone, metrics: input.metrics, custom: input.custom ?? "" },
      scores: input.scores,
      problemText: input.problemText,
      answerText: input.answerText,
      resultText: input.resultText,
      summary: input.summary,
      status: "DONE",
    },
  });

  // 원본 답안 이미지는 디스크에 저장하고 경로만 DB에 기록한다.
  // 이미지 저장이 실패해도 첨삭 자체는 이미 저장됐으므로, 경고만 돌려주고 진행한다.
  let imageWarning: string | undefined;
  const imgs = (input.images ?? []).filter(Boolean);
  if (imgs.length > 0) {
    try {
      const paths = await saveCorrectionImages(c.id, imgs);
      await prisma.correction.update({ where: { id: c.id }, data: { images: paths } });
    } catch (e) {
      console.error("첨삭 원본 이미지 저장 실패:", e);
      imageWarning = `첨삭은 저장됐지만 원본 이미지 보관에 실패했습니다. ${errorMessage(e, "")}`.trim();
    }
  }

  revalidatePath("/reading/corrections");
  if (input.studentId) revalidatePath(`/reading/students/${input.studentId}`);
  return { ok: true as const, id: c.id, imageWarning };
}

export async function updateCorrectionResult(id: number, resultText: string) {
  await requireSession();
  await prisma.correction.update({ where: { id }, data: { resultText } });
  revalidatePath(`/reading/corrections/${id}`);
  return { ok: true };
}

export async function deleteCorrection(id: number) {
  await requireSession();
  const c = await prisma.correction.findUnique({ where: { id }, select: { studentId: true } });
  await prisma.correction.delete({ where: { id } });
  // 원본 이미지 폴더도 함께 정리(실패해도 삭제 자체는 진행)
  try {
    await deleteCorrectionImages(id);
  } catch (e) {
    console.error("첨삭 원본 이미지 삭제 실패:", e);
  }
  revalidatePath("/reading/corrections");
  if (c?.studentId) revalidatePath(`/reading/students/${c.studentId}`);
  return { ok: true };
}
