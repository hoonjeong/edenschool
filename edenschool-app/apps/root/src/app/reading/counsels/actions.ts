"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/reading/session";

export async function createCounsel(input: {
  studentId: number;
  type: string;
  content: string;
  nextAction?: string;
  nextDate?: string | null;
  observationId?: number | null;
}) {
  await requireSession();
  await prisma.counsel.create({
    data: {
      studentId: input.studentId,
      type: input.type,
      content: input.content.trim(),
      nextAction: input.nextAction?.trim() || null,
      nextDate: input.nextDate ? new Date(input.nextDate + "T00:00:00") : null,
      observationId: input.observationId ?? null,
    },
  });
  revalidatePath("/reading/counsels");
  revalidatePath(`/reading/students/${input.studentId}`);
  return { ok: true };
}

export async function deleteCounsel(id: number, studentId: number) {
  await requireSession();
  await prisma.counsel.delete({ where: { id } });
  revalidatePath("/reading/counsels");
  revalidatePath(`/reading/students/${studentId}`);
  return { ok: true };
}
