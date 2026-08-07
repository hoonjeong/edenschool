"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/reading/session";

export interface MakeupInput {
  studentId: number;
  absentDate: string; // yyyy-mm-dd
  makeupDate: string; // yyyy-mm-dd
  weekday: number; // 0=일 ... 6=토
  time?: string;
  attended?: string;
  session?: string;
  progress?: string;
  teacher?: string;
  teacherNote?: string;
  note?: string;
}

function clean(v?: string) {
  const t = v?.trim();
  return t ? t : null;
}

export async function createMakeup(input: MakeupInput) {
  await requireSession();
  await prisma.makeupClass.create({
    data: {
      studentId: input.studentId,
      absentDate: new Date(input.absentDate + "T00:00:00"),
      makeupDate: new Date(input.makeupDate + "T00:00:00"),
      weekday: input.weekday,
      time: clean(input.time),
      attended: clean(input.attended),
      session: clean(input.session),
      progress: clean(input.progress),
      teacher: clean(input.teacher),
      teacherNote: clean(input.teacherNote),
      note: clean(input.note),
    },
  });
  revalidatePath("/reading/makeup");
  revalidatePath(`/reading/students/${input.studentId}`);
  return { ok: true };
}

export async function updateMakeup(id: number, input: MakeupInput) {
  await requireSession();
  await prisma.makeupClass.update({
    where: { id },
    data: {
      studentId: input.studentId,
      absentDate: new Date(input.absentDate + "T00:00:00"),
      makeupDate: new Date(input.makeupDate + "T00:00:00"),
      weekday: input.weekday,
      time: clean(input.time),
      attended: clean(input.attended),
      session: clean(input.session),
      progress: clean(input.progress),
      teacher: clean(input.teacher),
      teacherNote: clean(input.teacherNote),
      note: clean(input.note),
    },
  });
  revalidatePath("/reading/makeup");
  revalidatePath(`/reading/students/${input.studentId}`);
  return { ok: true };
}

export async function deleteMakeup(id: number, studentId: number) {
  await requireSession();
  await prisma.makeupClass.delete({ where: { id } });
  revalidatePath("/reading/makeup");
  revalidatePath(`/reading/students/${studentId}`);
  return { ok: true };
}
