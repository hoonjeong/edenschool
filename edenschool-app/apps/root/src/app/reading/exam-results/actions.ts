"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/reading/session";
import { gradeTotal, stringifyAnswers, type ExamItemLike } from "@/lib/reading/exam";

export interface ExamResultInput {
  examId: number;
  studentId: number;
  takenAt: string; // yyyy-mm-dd
  answers: (number | null)[];
  comment?: string | null;
}

/** 학생 응시 결과 저장 — (시험, 학생) 조합당 1건. 저장 시 자동 채점된다. */
export async function saveExamResult(input: ExamResultInput) {
  await requireSession();
  if (!input.examId) return { ok: false as const, error: "시험을 선택하세요." };
  if (!input.studentId) return { ok: false as const, error: "학생을 선택하세요." };
  if (!input.takenAt) return { ok: false as const, error: "응시일을 입력하세요." };

  const items = await prisma.examItem.findMany({
    where: { examId: input.examId },
    orderBy: { no: "asc" },
  });
  if (items.length === 0) return { ok: false as const, error: "이 시험지에 문항 정보가 없습니다. 먼저 문항을 저장하세요." };

  const answers = input.answers.map((a) => (a == null || Number.isNaN(a) ? null : Number(a)));
  const totalScore = gradeTotal(items as ExamItemLike[], answers);
  const data = {
    takenAt: new Date(input.takenAt + "T00:00:00"),
    answers: stringifyAnswers(answers),
    totalScore,
    comment: input.comment?.trim() || null,
  };

  const saved = await prisma.examResult.upsert({
    where: { examId_studentId: { examId: input.examId, studentId: input.studentId } },
    create: { examId: input.examId, studentId: input.studentId, ...data },
    update: data,
  });

  revalidateResult(input.studentId, input.examId);
  return { ok: true as const, id: saved.id, totalScore };
}

export async function deleteExamResult(id: number) {
  await requireSession();
  const row = await prisma.examResult.findUnique({ where: { id } });
  if (!row) return { ok: false as const, error: "결과를 찾을 수 없습니다." };
  await prisma.examResult.delete({ where: { id } });
  revalidateResult(row.studentId, row.examId);
  return { ok: true as const };
}

/** 분석표의 종합의견만 저장 */
export async function saveExamComment(id: number, comment: string) {
  await requireSession();
  const row = await prisma.examResult.update({
    where: { id },
    data: { comment: comment.trim() || null },
  });
  revalidateResult(row.studentId, row.examId);
  revalidatePath(`/reading/exam-results/${id}`);
  return { ok: true as const };
}

function revalidateResult(studentId: number, examId: number) {
  revalidatePath("/reading/exam-results");
  revalidatePath("/reading/exams");
  revalidatePath(`/reading/exams/${examId}`);
  revalidatePath("/reading/reports");
  revalidatePath(`/reading/students/${studentId}`);
}
