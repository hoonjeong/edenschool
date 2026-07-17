"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";

export async function addClinic(input: {
  studentId: number;
  weekday: number;
  time: string;
  endTime?: string;
  subject: string;
  teacher?: string;
  progress?: string;
  note?: string;
}) {
  await prisma.clinic.create({
    data: {
      studentId: input.studentId,
      weekday: input.weekday,
      time: input.time,
      endTime: input.endTime?.trim() || null,
      subject: input.subject || "클리닉",
      teacher: input.teacher?.trim() || null,
      progress: input.progress?.trim() || null,
      note: input.note?.trim() || null,
    },
  });
  revalidatePath("/reading/clinic");
  revalidatePath(`/reading/students/${input.studentId}`);
  return { ok: true };
}

export async function deleteClinic(id: number) {
  await prisma.clinic.delete({ where: { id } });
  revalidatePath("/reading/clinic");
  return { ok: true };
}
