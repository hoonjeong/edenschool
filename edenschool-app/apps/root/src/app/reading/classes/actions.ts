"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";

export interface ClassInput {
  name: string;
  schedule?: string;
  capacity: number;
  color: string;
  teacherId?: number | null;
}

export async function createClass(input: ClassInput) {
  await prisma.class.create({
    data: {
      name: input.name.trim(),
      schedule: input.schedule?.trim() || null,
      capacity: input.capacity,
      color: input.color,
      teacherId: input.teacherId ?? null,
    },
  });
  revalidatePath("/reading/classes");
  return { ok: true };
}

export async function updateClass(id: number, input: ClassInput) {
  await prisma.class.update({
    where: { id },
    data: {
      name: input.name.trim(),
      schedule: input.schedule?.trim() || null,
      capacity: input.capacity,
      color: input.color,
      teacherId: input.teacherId ?? null,
    },
  });
  revalidatePath("/reading/classes");
  return { ok: true };
}

export async function deleteClass(id: number) {
  // 소속 학생은 미배정으로 (이력/학생 보존)
  await prisma.student.updateMany({ where: { classId: id }, data: { classId: null } });
  await prisma.class.delete({ where: { id } });
  revalidatePath("/reading/classes");
  revalidatePath("/reading/students");
  return { ok: true };
}

export async function moveStudent(studentId: number, classId: number | null) {
  await prisma.student.update({ where: { id: studentId }, data: { classId } });
  revalidatePath("/reading/classes");
  revalidatePath("/reading/students");
  return { ok: true };
}
