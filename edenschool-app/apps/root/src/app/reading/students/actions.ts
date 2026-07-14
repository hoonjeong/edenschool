"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";

function last4(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}

export interface StudentInput {
  name: string;
  grade: string;
  phone: string;
  status?: "ENROLLED" | "PAUSED" | "WITHDRAWN";
  classId?: number | null;
  memo?: string;
}

export async function createStudent(input: StudentInput) {
  await prisma.student.create({
    data: {
      name: input.name.trim(),
      grade: input.grade,
      phone: input.phone.trim(),
      phoneLast4: last4(input.phone),
      status: input.status ?? "ENROLLED",
      classId: input.classId ?? null,
      memo: input.memo?.trim() || null,
    },
  });
  revalidatePath("/reading/students");
  revalidatePath("/reading");
  return { ok: true };
}

export async function updateStudent(id: number, input: StudentInput) {
  await prisma.student.update({
    where: { id },
    data: {
      name: input.name.trim(),
      grade: input.grade,
      phone: input.phone.trim(),
      phoneLast4: last4(input.phone),
      status: input.status,
      classId: input.classId ?? null,
      memo: input.memo?.trim() || null,
    },
  });
  revalidatePath("/reading/students");
  revalidatePath(`/reading/students/${id}`);
  return { ok: true };
}

/** 기본은 '퇴원' 전환(이력 보존). hard=true 이면 완전 삭제(관리자). */
export async function removeStudent(id: number, hard = false) {
  if (hard) {
    await prisma.student.delete({ where: { id } });
  } else {
    await prisma.student.update({
      where: { id },
      data: { status: "WITHDRAWN", classId: null },
    });
  }
  revalidatePath("/reading/students");
  revalidatePath("/reading");
  return { ok: true };
}

export async function assignClass(studentId: number, classId: number | null) {
  await prisma.student.update({ where: { id: studentId }, data: { classId } });
  revalidatePath("/reading/students");
  revalidatePath("/reading/classes");
  return { ok: true };
}
