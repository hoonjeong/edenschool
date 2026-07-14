"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { generateCorrection, type GenInput } from "@/lib/reading/correction-engine";
import { getEdenPhilosophy } from "@/lib/reading/settings";
import { hasClaudeKey } from "@/lib/reading/claude";
import { recognizeImageWithClaude, analyzeAnswerWithClaude } from "@/lib/reading/correction-ai";

// ── ② 자동 인식 (OCR 목업) ──
// 실제로는 업로드 이미지 → OCR. 여기서는 예시 답안을 반환하고, 신뢰도 낮은 글자는 [[ ]]로 표시.
const SAMPLES = [
  {
    problem: "책을 읽고 가장 기억에 남는 장면과 그 까닭을 써 봅시다.",
    answer:
      "내가 가장 기억에 남는 장면은 주인공이 [[친구]]를 도와주는 장면이다. 왜냐하면 나도 친구를 도와준 적이 있어서 [[공감]]이 갔기 때문이다. 그리고 주인공이 용기를 내는 모습이 멋있었다.",
  },
  {
    problem: "우리 반에 필요한 규칙 한 가지를 정하고, 그 까닭을 설명해 봅시다.",
    answer:
      "우리 반에는 [[복도]]에서 뛰지 않기 규칙이 필요하다. 왜냐하면 뛰다가 부딪히면 다칠 수 있기 때문이다. 규칙을 지키면 모두가 안전하게 지낼 수 있다.",
  },
  {
    problem: "겨울 방학에 있었던 일 중 가장 즐거웠던 일을 일기로 써 봅시다.",
    answer:
      "오늘은 가족과 함께 [[눈썰매장]]에 갔다. 처음에는 무서웠지만 타 보니 정말 재미있었다. 다음에도 또 가고 싶다는 생각이 들었다.",
  },
];

export async function recognizeMock(seedIndex?: number) {
  const i = seedIndex != null ? seedIndex % SAMPLES.length : Math.floor(Math.random() * SAMPLES.length);
  return SAMPLES[i];
}

// 업로드 이미지가 있고 Claude 키가 있으면 실제 비전 OCR, 아니면 샘플 목업
export async function recognizeImage(dataUrl?: string) {
  if (dataUrl && hasClaudeKey()) {
    try {
      return { ...(await recognizeImageWithClaude(dataUrl)), ai: true };
    } catch (e) {
      console.error("Claude OCR 실패, 샘플로 대체:", e);
    }
  }
  return { ...(await recognizeMock()), ai: false };
}

// ── ⑤ 첨삭 실행 (미저장, 미리보기용) — 실제 Claude 우선, 실패 시 목업 ──
export async function runCorrection(
  input: Omit<GenInput, "edenDirection"> & { edenDirection?: string },
) {
  const edenDirection = input.edenDirection?.trim() || (await getEdenPhilosophy());
  const full = { ...input, edenDirection };
  if (hasClaudeKey()) {
    try {
      return { ...(await analyzeAnswerWithClaude(full)), ai: true };
    } catch (e) {
      console.error("Claude 첨삭 실패, 목업으로 대체:", e);
    }
  }
  return { ...generateCorrection(full), ai: false };
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
}) {
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
  revalidatePath("/reading/corrections");
  if (input.studentId) revalidatePath(`/reading/students/${input.studentId}`);
  return { ok: true, id: c.id };
}

export async function updateCorrectionResult(id: number, resultText: string) {
  await prisma.correction.update({ where: { id }, data: { resultText } });
  revalidatePath(`/reading/corrections/${id}`);
  return { ok: true };
}

export async function deleteCorrection(id: number) {
  await prisma.correction.delete({ where: { id } });
  revalidatePath("/reading/corrections");
  return { ok: true };
}
