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
  revalidateAfterMakeup(input.studentId);
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
  revalidateAfterMakeup(input.studentId);
  return { ok: true };
}

/** 보강 완료 — 결석일 출결을 '보강(MAKEUP)'으로 바꿔 출결 관리에도 반영한다. */
export async function completeMakeup(id: number) {
  await requireSession();
  const m = await prisma.makeupClass.findUnique({ where: { id } });
  if (!m) return { ok: false, error: "보강 기록을 찾을 수 없습니다." };

  await prisma.attendance.upsert({
    where: { studentId_date: { studentId: m.studentId, date: m.absentDate } },
    create: { studentId: m.studentId, date: m.absentDate, status: "MAKEUP", method: "MANUAL" },
    update: { status: "MAKEUP", method: "MANUAL" },
  });
  revalidateAfterMakeup(m.studentId);
  return { ok: true };
}

/** 보강 완료 취소 — 결석일 출결을 다시 '결석'으로 되돌린다. */
export async function reopenMakeup(id: number) {
  await requireSession();
  const m = await prisma.makeupClass.findUnique({ where: { id } });
  if (!m) return { ok: false, error: "보강 기록을 찾을 수 없습니다." };

  await prisma.attendance.updateMany({
    where: { studentId: m.studentId, date: m.absentDate, status: "MAKEUP" },
    data: { status: "ABSENT", method: "MANUAL" },
  });
  revalidateAfterMakeup(m.studentId);
  return { ok: true };
}

function revalidateAfterMakeup(studentId: number) {
  revalidatePath("/reading/makeup");
  revalidatePath("/reading/attendance");
  revalidatePath("/reading");
  revalidatePath(`/reading/students/${studentId}`);
}

export async function deleteMakeup(id: number, studentId: number) {
  await requireSession();
  const m = await prisma.makeupClass.findUnique({ where: { id } });
  await prisma.makeupClass.delete({ where: { id } });
  // 완료 처리했던 보강이면 출결을 다시 '결석'으로 되돌려 보강 대기에 나타나게 한다.
  if (m) {
    await prisma.attendance.updateMany({
      where: { studentId: m.studentId, date: m.absentDate, status: "MAKEUP" },
      data: { status: "ABSENT", method: "MANUAL" },
    });
  }
  revalidateAfterMakeup(studentId);
  return { ok: true };
}
