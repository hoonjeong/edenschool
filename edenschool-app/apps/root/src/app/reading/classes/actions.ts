"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/reading/session";

export interface ClassInput {
  name: string;
  schedule?: string;
  capacity: number;
  color: string;
  teacherId?: number | null;
  /** 담당 선생님 이름(직접 입력). 목록에 없으면 선생님으로 새로 등록한다. */
  teacherName?: string | null;
}

// 담당 선생님 확정: 입력된 이름 → 기존 선생님 매칭 → 없으면 신규 등록.
// 이름이 비어 있으면 담당 미정(null).
async function resolveTeacherId(input: ClassInput): Promise<number | null> {
  if (input.teacherName === undefined) return input.teacherId ?? null;

  const name = (input.teacherName ?? "").trim();
  if (!name) return null;

  // 기존 선택 그대로면 그대로 유지
  if (input.teacherId) {
    const current = await prisma.user.findUnique({ where: { id: input.teacherId } });
    if (current && current.name === name) return current.id;
  }

  const found = await prisma.user.findFirst({ where: { name }, orderBy: { id: "asc" } });
  if (found) return found.id;

  // 신규 선생님 등록 (이메일은 임시값 — 설정 > 계정·권한에서 수정)
  let email = "";
  for (let i = 0; i < 5; i++) {
    const candidate = `teacher-${Math.random().toString(36).slice(2, 10)}@edenbooks.local`;
    const dup = await prisma.user.findUnique({ where: { email: candidate } });
    if (!dup) {
      email = candidate;
      break;
    }
  }
  if (!email) throw new Error("선생님을 등록하지 못했습니다. 다시 시도해 주세요.");

  const created = await prisma.user.create({
    data: { name, email, role: "TEACHER" as never },
  });
  revalidatePath("/reading/settings");
  return created.id;
}

export async function createClass(input: ClassInput) {
  await requireSession();
  const teacherId = await resolveTeacherId(input);
  await prisma.class.create({
    data: {
      name: input.name.trim(),
      schedule: input.schedule?.trim() || null,
      capacity: input.capacity,
      color: input.color,
      teacherId,
    },
  });
  revalidatePath("/reading/classes");
  return { ok: true };
}

export async function updateClass(id: number, input: ClassInput) {
  await requireSession();
  const teacherId = await resolveTeacherId(input);
  await prisma.class.update({
    where: { id },
    data: {
      name: input.name.trim(),
      schedule: input.schedule?.trim() || null,
      capacity: input.capacity,
      color: input.color,
      teacherId,
    },
  });
  revalidatePath("/reading/classes");
  return { ok: true };
}

export async function deleteClass(id: number) {
  await requireSession();
  // 소속 학생은 미배정으로 (이력/학생 보존)
  await prisma.student.updateMany({ where: { classId: id }, data: { classId: null } });
  await prisma.class.delete({ where: { id } });
  revalidatePath("/reading/classes");
  revalidatePath("/reading/students");
  return { ok: true };
}

export async function moveStudent(studentId: number, classId: number | null) {
  await requireSession();
  await prisma.student.update({ where: { id: studentId }, data: { classId } });
  revalidatePath("/reading/classes");
  revalidatePath("/reading/students");
  return { ok: true };
}
