import { prisma } from "@/lib/reading/prisma";
import { getGrowthSeries } from "@/lib/reading/data";
import { toYmd } from "@/lib/reading/utils";
import {
  parseAnswers,
  groupScores,
  averageByKey,
  totalPossible,
  round1,
  examTitle,
  type ExamItemLike,
} from "@/lib/reading/exam";
import ReportsClient from "./reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const sp = await searchParams;
  const students = await prisma.student.findMany({
    where: { status: "ENROLLED" },
    select: {
      id: true,
      name: true,
      grade: true,
      class: { select: { name: true } },
      _count: { select: { observations: true } },
    },
    orderBy: { name: "asc" },
  });

  // 시험 결과 수(테이블 미적용이면 빈 맵)
  const examCounts = new Map<number, number>();
  try {
    const grouped = await prisma.examResult.groupBy({ by: ["studentId"], _count: { _all: true } });
    for (const g of grouped) examCounts.set(g.studentId, g._count._all);
  } catch (e) {
    console.error("[exam] ExamResult 집계 실패 — 테이블이 없을 수 있습니다.", e);
  }

  // 관찰일지 또는 시험 결과가 있는 학생만 리포트 대상
  const withData = students.filter((s) => s._count.observations > 0 || (examCounts.get(s.id) ?? 0) > 0);
  const selId = sp.studentId ? Number(sp.studentId) : withData[0]?.id;

  let growth: any[] = [];
  let student: any = null;
  let examReports: any[] = [];

  if (selId) {
    student = students.find((s) => s.id === selId);
    growth = await getGrowthSeries(selId);
    examReports = await buildExamReports(selId);
  }

  return (
    <ReportsClient
      students={students.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        className: s.class?.name ?? null,
        obsCount: s._count.observations,
        examCount: examCounts.get(s.id) ?? 0,
      }))}
      selectedId={selId ?? null}
      student={student ? { id: student.id, name: student.name, grade: student.grade, className: student.class?.name ?? null } : null}
      growth={growth.map((g) => ({ round: g.round, date: g.date.toISOString(), scores: g.scores, count: g.count }))}
      examReports={examReports}
    />
  );
}

/** 학생의 시험 응시 결과 + 영역별/독해능력별 점수(응시자 평균 포함).
    시험 테이블이 아직 없으면 빈 배열(기존 성장 리포트는 그대로 동작). */
async function buildExamReports(studentId: number) {
  try {
    return await loadExamReports(studentId);
  } catch (e) {
    console.error("[exam] 시험 리포트 조회 실패 — 테이블이 없을 수 있습니다.", e);
    return [];
  }
}

async function loadExamReports(studentId: number) {
  const mine = await prisma.examResult.findMany({
    where: { studentId },
    include: { exam: { select: { id: true, type: true, round: true } } },
    orderBy: [{ takenAt: "asc" }, { id: "asc" }],
  });
  if (mine.length === 0) return [];

  const examIds = [...new Set(mine.map((r) => r.examId))];
  const [items, peers] = await Promise.all([
    prisma.examItem.findMany({ where: { examId: { in: examIds } }, orderBy: { no: "asc" } }),
    prisma.examResult.findMany({
      where: { examId: { in: examIds } },
      select: { examId: true, answers: true, totalScore: true },
    }),
  ]);

  return mine.map((r) => {
    const list = items.filter((i) => i.examId === r.examId) as ExamItemLike[];
    const peerRows = peers.filter((p) => p.examId === r.examId);
    const peerAnswers = peerRows.map((p) => parseAnswers(p.answers, Math.max(list.length, 1)));
    const answers = parseAnswers(r.answers, Math.max(list.length, 1));

    const areaAvg = averageByKey(list, peerAnswers, (it) => it.area);
    const abilityAvg = averageByKey(list, peerAnswers, (it) => it.ability);

    return {
      id: r.id,
      examId: r.examId,
      title: examTitle(r.exam.type, r.exam.round),
      takenAt: toYmd(r.takenAt),
      score: r.totalScore,
      full: totalPossible(list),
      avg: peerRows.length ? round1(peerRows.reduce((s, p) => s + p.totalScore, 0) / peerRows.length) : 0,
      peerCount: peerRows.length,
      areas: groupScores(list, answers, (it) => it.area).map((g) => ({ ...g, avg: areaAvg.get(g.key) ?? 0 })),
      abilities: groupScores(list, answers, (it) => it.ability).map((g) => ({ ...g, avg: abilityAvg.get(g.key) ?? 0 })),
    };
  });
}
