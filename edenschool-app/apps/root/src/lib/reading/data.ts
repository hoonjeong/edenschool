import "server-only";
import { prisma } from "./prisma";
import { LEVEL_SCORE, type Level } from "./rubric";

// ── 학생 목록 + 통계 ──────────────────────────────────
export async function getStudentsWithStats() {
  const [students, attGroups, lastCounsels] = await Promise.all([
    prisma.student.findMany({
      include: { class: true },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.attendance.groupBy({
      by: ["studentId", "status"],
      _count: { _all: true },
    }),
    prisma.counsel.groupBy({
      by: ["studentId"],
      _max: { date: true },
    }),
  ]);

  const attMap = new Map<number, { total: number; present: number }>();
  for (const g of attGroups) {
    const cur = attMap.get(g.studentId) ?? { total: 0, present: 0 };
    cur.total += g._count._all;
    if (g.status !== "ABSENT") cur.present += g._count._all;
    attMap.set(g.studentId, cur);
  }
  const counselMap = new Map(lastCounsels.map((c) => [c.studentId, c._max.date]));

  return students.map((s) => {
    const att = attMap.get(s.id);
    const rate = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
    return {
      ...s,
      attendanceRate: rate,
      lastCounselAt: counselMap.get(s.id) ?? null,
    };
  });
}

// ── 관찰일지 → 영역별 성장 점수(0~100) ────────────────
export interface ObsItem {
  area: string;
  key: string;
  item: string;
  level: Level;
  text: string;
  note?: string;
}

export function areaScores(items: ObsItem[]): Record<string, number> {
  const byArea: Record<string, number[]> = {};
  for (const it of items) {
    (byArea[it.area] ??= []).push(LEVEL_SCORE[it.level]);
  }
  const out: Record<string, number> = {};
  for (const [area, arr] of Object.entries(byArea)) {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length; // 1~3
    out[area] = Math.round(((avg - 1) / 2) * 100); // 0~100
  }
  return out;
}

/** 학생의 회차별 영역 점수 시계열 (성장 리포트용) */
export async function getGrowthSeries(studentId: number) {
  const obs = await prisma.observation.findMany({
    where: { studentId },
    orderBy: { round: "asc" },
  });
  return obs.map((o) => {
    const items = (o.items as unknown as ObsItem[]) ?? [];
    return {
      round: o.round,
      date: o.date,
      scores: areaScores(items),
      count: items.length,
    };
  });
}

