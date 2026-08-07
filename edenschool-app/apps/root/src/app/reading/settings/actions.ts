"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/reading/password";
import { requireSession } from "@/lib/reading/session";

export async function saveEdenPhilosophy(text: string) {
  await requireSession();
  await prisma.appSetting.upsert({
    where: { key: "eden_philosophy" },
    create: { key: "eden_philosophy", value: text },
    update: { value: text },
  });
  revalidatePath("/reading/settings");
  revalidatePath("/reading/corrections/new");
  return { ok: true };
}

export async function createUser(input: { name: string; email: string; role: string; password: string }) {
  await requireSession();
  const exists = await prisma.user.findUnique({ where: { email: input.email.trim() } });
  if (exists) return { ok: false, error: "이미 존재하는 이메일입니다." };
  await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role as never,
      passwordHash: hashPassword(input.password || "eden1234"),
    },
  });
  revalidatePath("/reading/settings");
  return { ok: true };
}

export async function updateUserRole(id: number, role: string) {
  await requireSession();
  await prisma.user.update({ where: { id }, data: { role: role as never } });
  revalidatePath("/reading/settings");
  return { ok: true };
}

export async function toggleUserActive(id: number, active: boolean) {
  await requireSession();
  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/reading/settings");
  return { ok: true };
}

export async function resetUserPassword(id: number, password: string) {
  await requireSession();
  await prisma.user.update({ where: { id }, data: { passwordHash: hashPassword(password || "eden1234") } });
  revalidatePath("/reading/settings");
  return { ok: true };
}
