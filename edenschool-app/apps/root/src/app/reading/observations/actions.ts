"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";

export interface ObsItemInput {
  area: string;
  key: string;
  item: string;
  level: "상" | "중" | "하";
  text: string;
  note?: string;
}

export async function createObservation(input: {
  studentId: number;
  round?: number;
  items: ObsItemInput[];
  memo?: string;
}) {
  let round = input.round;
  if (!round) {
    const last = await prisma.observation.findFirst({
      where: { studentId: input.studentId },
      orderBy: { round: "desc" },
      select: { round: true },
    });
    round = (last?.round ?? 0) + 1;
  }

  const obs = await prisma.observation.create({
    data: {
      studentId: input.studentId,
      round,
      items: input.items as never,
      memo: input.memo?.trim() || null,
    },
  });
  revalidatePath("/reading/observations");
  revalidatePath(`/reading/students/${input.studentId}`);
  revalidatePath("/reading/reports");
  return { ok: true, id: obs.id };
}

export async function deleteObservation(id: number, studentId: number) {
  await prisma.observation.delete({ where: { id } });
  revalidatePath("/reading/observations");
  revalidatePath(`/reading/students/${studentId}`);
  return { ok: true };
}
