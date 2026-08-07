"use server";

import { prisma } from "@/lib/reading/prisma";
import { revalidatePath } from "next/cache";
import { sendBulk } from "@/lib/reading/sms";
import { areaScores, type ObsItem } from "@/lib/reading/data";
import { requireSession } from "@/lib/reading/session";

// ── 템플릿 CRUD ──
export async function createTemplate(input: { title: string; body: string }) {
  await requireSession();
  const variables = extractVars(input.body);
  await prisma.noticeTemplate.create({
    data: { title: input.title.trim(), body: input.body, variables },
  });
  revalidatePath("/reading/notices");
  return { ok: true };
}
export async function updateTemplate(id: number, input: { title: string; body: string }) {
  await requireSession();
  const variables = extractVars(input.body);
  await prisma.noticeTemplate.update({
    where: { id },
    data: { title: input.title.trim(), body: input.body, variables },
  });
  revalidatePath("/reading/notices");
  return { ok: true };
}
export async function deleteTemplate(id: number) {
  await requireSession();
  await prisma.noticeTemplate.delete({ where: { id } });
  revalidatePath("/reading/notices");
  return { ok: true };
}

function extractVars(body: string): string[] {
  const set = new Set<string>();
  for (const m of body.matchAll(/\{([^}]+)\}/g)) set.add(m[1]);
  return [...set];
}

// ── 변수 치환용 학생 데이터 계산 ──
async function buildVarsForStudents(studentIds: number[]) {
  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      class: true,
      observations: { orderBy: { round: "desc" }, take: 1 },
    },
  });

  return students.map((s) => {
    let score = "-";
    let highlight = "성실히 수업에 참여하는";
    const obs = s.observations[0];
    if (obs) {
      const items = (obs.items as unknown as ObsItem[]) ?? [];
      const areas = areaScores(items);
      const vals = Object.values(areas);
      if (vals.length) score = String(Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
      const top = items.find((i) => i.level === "상");
      if (top) highlight = `${top.item}이(가) 우수한`;
    }
    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      vars: {
        이름: s.name,
        반: s.class?.name ?? "미배정",
        점수: score,
        특이점: highlight,
        다음수업: s.class?.schedule ?? "다음 수업",
      } as Record<string, string>,
    };
  });
}

function substitute(body: string, vars: Record<string, string>): string {
  return body.replace(/\{([^}]+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

// ── 미리보기 (개인별 치환 결과) ──
export async function previewNotices(templateBody: string, studentIds: number[]) {
  await requireSession();
  const data = await buildVarsForStudents(studentIds);
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    message: substitute(templateBody, d.vars),
  }));
}

// ── 발송 (알리고 · 자격증명 없으면 드라이런) ──
export async function sendNotices(templateBody: string, studentIds: number[], templateId?: number) {
  await requireSession();
  const data = await buildVarsForStudents(studentIds);
  const items = data.map((d) => ({ phone: d.phone, message: substitute(templateBody, d.vars) }));
  const result = await sendBulk(items, { templateId });
  revalidatePath("/reading/notices");
  return result;
}
