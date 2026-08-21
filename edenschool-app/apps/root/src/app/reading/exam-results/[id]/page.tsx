import { notFound } from "next/navigation";
import { prisma } from "@/lib/reading/prisma";
import { toYmd } from "@/lib/reading/utils";
import {
  parseAnswers,
  groupScores,
  averageByKey,
  wrongRates,
  totalPossible,
  round1,
  type ExamItemLike,
} from "@/lib/reading/exam";
import ReportSheet from "./report-sheet";

export const dynamic = "force-dynamic";

export default async function ExamReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultId = Number(id);
  if (!Number.isInteger(resultId)) notFound();

  const result = await prisma.examResult.findUnique({
    where: { id: resultId },
    include: {
      student: { select: { id: true, name: true, grade: true, class: { select: { name: true } } } },
      exam: { select: { id: true, type: true, round: true } },
    },
  });
  if (!result) notFound();

  const [items, peers] = await Promise.all([
    prisma.examItem.findMany({ where: { examId: result.examId }, orderBy: { no: "asc" } }),
    prisma.examResult.findMany({
      where: { examId: result.examId },
      select: { answers: true, totalScore: true },
    }),
  ]);

  const list = items as ExamItemLike[];
  const answers = parseAnswers(result.answers, Math.max(list.length, 1));
  const peerAnswers = peers.map((p) => parseAnswers(p.answers, Math.max(list.length, 1)));

  const full = totalPossible(list);
  const avgTotal = peers.length ? round1(peers.reduce((s, p) => s + p.totalScore, 0) / peers.length) : 0;

  const areaAvg = averageByKey(list, peerAnswers, (it) => it.area);
  const abilityAvg = averageByKey(list, peerAnswers, (it) => it.ability);

  const areas = groupScores(list, answers, (it) => it.area).map((g) => ({
    ...g,
    avg: areaAvg.get(g.key) ?? 0,
  }));
  const abilities = groupScores(list, answers, (it) => it.ability).map((g) => ({
    ...g,
    avg: abilityAvg.get(g.key) ?? 0,
  }));

  const rates = wrongRates(list, peerAnswers);
  const rows = list.map((it, i) => ({
    no: it.no,
    answer: it.answer,
    given: answers[it.no - 1],
    correct: answers[it.no - 1] === it.answer,
    wrongRate: rates[i],
    area: it.area,
    ability: it.ability,
    note: it.note,
  }));

  return (
    <ReportSheet
      result={{
        id: result.id,
        takenAt: toYmd(result.takenAt),
        totalScore: result.totalScore,
        comment: result.comment,
      }}
      exam={{ id: result.exam.id, type: result.exam.type, round: result.exam.round }}
      student={{
        id: result.student.id,
        name: result.student.name,
        grade: result.student.grade,
        className: result.student.class?.name ?? null,
      }}
      full={full}
      avgTotal={avgTotal}
      peerCount={peers.length}
      areas={areas}
      abilities={abilities}
      rows={rows}
    />
  );
}
