"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";

type Status = "PRESENT" | "LATE" | "ABSENT" | "MAKEUP";

function parseDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 관리자 수동 출결 지정/변경 (upsert) */
export async function setAttendance(studentId: number, dateStr: string, status: Status) {
  const date = parseDate(dateStr);
  await prisma.attendance.upsert({
    where: { studentId_date: { studentId, date } },
    create: { studentId, date, status, method: "MANUAL" },
    update: { status, method: "MANUAL" },
  });
  revalidatePath("/reading/attendance");
  revalidatePath("/reading");
  return { ok: true };
}

/** 출결 기록 삭제 (미등원으로 되돌림) */
export async function clearAttendance(studentId: number, dateStr: string) {
  const date = parseDate(dateStr);
  await prisma.attendance.deleteMany({ where: { studentId, date } });
  revalidatePath("/reading/attendance");
  revalidatePath("/reading");
  return { ok: true };
}
