"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/reading/session";

function todayDate() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface Match {
  id: number;
  name: string;
  grade: string;
  className: string | null;
  alreadyChecked: boolean;
}

/** 뒷자리 4자리로 재원생 조회. 중복 시 다건 반환. */
export async function lookupByLast4(last4: string): Promise<Match[]> {
  await requireSession();
  const digits = last4.replace(/\D/g, "");
  if (digits.length !== 4) return [];

  const students = await prisma.student.findMany({
    where: { phoneLast4: digits, status: "ENROLLED" },
    include: { class: true },
    orderBy: { name: "asc" },
  });

  const today = todayDate();
  const checked = await prisma.attendance.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, date: today },
    select: { studentId: true },
  });
  const checkedSet = new Set(checked.map((c) => c.studentId));

  return students.map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    className: s.class?.name ?? null,
    alreadyChecked: checkedSet.has(s.id),
  }));
}

export interface CheckInResult {
  ok: boolean;
  duplicate?: boolean;
  name?: string;
  className?: string | null;
  message?: string;
}

/** 등원 체크인 기록 (당일 1회) */
export async function checkIn(studentId: number): Promise<CheckInResult> {
  await requireSession();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true },
  });
  if (!student) return { ok: false, message: "학생을 찾을 수 없습니다." };

  const today = todayDate();
  const existing = await prisma.attendance.findUnique({
    where: { studentId_date: { studentId, date: today } },
  });
  if (existing) {
    return { ok: false, duplicate: true, name: student.name, message: "오늘 이미 체크인했습니다." };
  }

  // 지각 판정: 18시 이후면 지각 처리(간단 규칙)
  const now = new Date();
  const status = now.getHours() >= 18 ? "LATE" : "PRESENT";

  await prisma.attendance.create({
    data: { studentId, date: today, status, method: "KEYPAD" },
  });
  revalidatePath("/reading/attendance");
  revalidatePath("/reading");
  return { ok: true, name: student.name, className: student.class?.name ?? null };
}
