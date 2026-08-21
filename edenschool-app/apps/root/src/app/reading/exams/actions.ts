"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/reading/session";
import { gradeTotal, parseAnswers, ITEM_COUNT, type ExamItemLike } from "@/lib/reading/exam";

export interface ExamItemInput {
  no: number;
  answer: number;
  score: number;
  area: string;
  ability?: string | null;
  note?: string | null;
}

const clean = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : null;
};

/** 시험지 생성 — 종류 + 회차. 문항은 이어지는 문항 입력 화면에서 저장한다. */
export async function createExam(input: { type: string; round: number }) {
  await requireSession();
  const type = input.type.trim();
  const round = Number(input.round);
  if (!type) return { ok: false as const, error: "시험지 종류를 선택하세요." };
  if (!Number.isInteger(round) || round < 1) return { ok: false as const, error: "회차는 1 이상의 숫자여야 합니다." };

  const dup = await prisma.exam.findUnique({ where: { type_round: { type, round } } });
  if (dup) return { ok: false as const, error: "이미 있는 회차입니다.", id: dup.id };

  const exam = await prisma.exam.create({ data: { type, round } });
  revalidatePath("/reading/exams");
  return { ok: true as const, id: exam.id };
}

/** 문항 정보 저장 — 전체 교체 후, 이미 입력된 응시 결과의 점수를 다시 채점한다. */
export async function saveExamItems(examId: number, items: ExamItemInput[]) {
  await requireSession();

  const rows = items.slice(0, ITEM_COUNT).map((it) => ({
    no: Number(it.no),
    answer: Number(it.answer),
    score: Number(it.score),
    area: (it.area ?? "").trim(),
    ability: clean(it.ability),
    note: clean(it.note),
  }));

  for (const r of rows) {
    if (!Number.isInteger(r.answer) || r.answer < 1 || r.answer > 5)
      return { ok: false as const, error: `${r.no}번 정답은 1~5 중 하나여야 합니다.` };
    if (!Number.isFinite(r.score) || r.score <= 0)
      return { ok: false as const, error: `${r.no}번 점수를 입력하세요.` };
    if (!r.area) return { ok: false as const, error: `${r.no}번 영역을 입력하세요.` };
  }

  await prisma.examItem.deleteMany({ where: { examId } });
  if (rows.length) {
    await prisma.examItem.createMany({ data: rows.map((r) => ({ ...r, examId })) });
  }

  // 문항(정답·배점)이 바뀌면 기존 결과의 총점도 달라진다 → 재채점
  const [saved, results] = await Promise.all([
    prisma.examItem.findMany({ where: { examId }, orderBy: { no: "asc" } }),
    prisma.examResult.findMany({ where: { examId }, select: { id: true, answers: true } }),
  ]);
  for (const r of results) {
    const total = gradeTotal(saved as ExamItemLike[], parseAnswers(r.answers));
    await prisma.examResult.update({ where: { id: r.id }, data: { totalScore: total } });
  }

  revalidatePath("/reading/exams");
  revalidatePath(`/reading/exams/${examId}`);
  revalidatePath("/reading/exam-results");
  return { ok: true as const };
}

/** 시험지 삭제 — 문항·응시 결과가 함께 삭제된다(FK CASCADE). */
export async function deleteExam(examId: number) {
  await requireSession();
  await prisma.exam.delete({ where: { id: examId } });
  revalidatePath("/reading/exams");
  revalidatePath("/reading/exam-results");
  return { ok: true as const };
}
