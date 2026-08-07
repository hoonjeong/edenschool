"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/reading/session";

export async function addClinic(input: {
  studentId: number;
  weekday: number;
  time: string;
  endTime?: string;
  subject: string;
  teacher?: string;
  note?: string;
}) {
  await requireSession();
  await prisma.clinic.create({
    data: {
      studentId: input.studentId,
      weekday: input.weekday,
      time: input.time,
      endTime: input.endTime?.trim() || null,
      subject: input.subject || "클리닉",
      teacher: input.teacher?.trim() || null,
      note: input.note?.trim() || null,
    },
  });
  revalidatePath("/reading/clinic");
  revalidatePath(`/reading/students/${input.studentId}`);
  return { ok: true };
}

export async function deleteClinic(id: number) {
  await requireSession();
  // ClinicProgress 는 FK CASCADE 로 동반 삭제됨
  await prisma.clinic.delete({ where: { id } });
  revalidatePath("/reading/clinic");
  return { ok: true };
}

// ── 주차별 진도 upsert (개별) ──
// content 가 빈 값이면 해당 주차 진도 삭제.
export async function upsertClinicProgress(clinicId: number, week: number, content: string) {
  await requireSession();
  const text = content.trim();
  if (!text) {
    await prisma.clinicProgress.deleteMany({ where: { clinicId, week } });
  } else {
    await prisma.clinicProgress.upsert({
      where: { clinicId_week: { clinicId, week } },
      create: { clinicId, week, content: text },
      update: { content: text },
    });
  }
  revalidatePath("/reading/clinic");
  return { ok: true };
}

// ── 주차별 진도 일괄 적용 (반 전체 등 다건에 동일 내용) ──
export async function batchUpsertClinicProgress(clinicIds: number[], week: number, content: string) {
  await requireSession();
  const ids = [...new Set(clinicIds)].filter((n) => Number.isFinite(n));
  if (ids.length === 0) return { ok: true, count: 0 };
  const text = content.trim();

  await prisma.$transaction(
    ids.map((clinicId) =>
      text
        ? prisma.clinicProgress.upsert({
            where: { clinicId_week: { clinicId, week } },
            create: { clinicId, week, content: text },
            update: { content: text },
          })
        : prisma.clinicProgress.deleteMany({ where: { clinicId, week } }),
    ),
  );

  revalidatePath("/reading/clinic");
  return { ok: true, count: ids.length };
}
