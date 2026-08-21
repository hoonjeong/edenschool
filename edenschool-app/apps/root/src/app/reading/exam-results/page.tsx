import { prisma } from "@/lib/reading/prisma";
import { toYmd } from "@/lib/reading/utils";
import { parseAnswers } from "@/lib/reading/exam";
import ResultsClient from "./results-client";

export const dynamic = "force-dynamic";

export default async function ExamResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ examId?: string; studentId?: string }>;
}) {
  const sp = await searchParams;

  const students = await prisma.student.findMany({
    where: { status: "ENROLLED" },
    select: { id: true, name: true, grade: true, class: { select: { name: true } } },
    orderBy: [{ name: "asc" }],
  });

  // DDL(sql/edenbooks-exam.sql) 적용 전이면 조회가 실패한다 → 안내만 띄운다.
  let exams: any[] = [];
  let dbReady = true;
  try {
    exams = await prisma.exam.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: [{ type: "asc" }, { round: "desc" }],
    });
  } catch (e) {
    console.error("[exam] Exam 조회 실패 — 테이블이 없을 수 있습니다.", e);
    dbReady = false;
  }

  // 문항이 입력된 시험지만 결과 입력에 쓸 수 있다.
  const ready = exams.filter((e) => e._count.items > 0);
  const selId = sp.examId && ready.some((e) => e.id === Number(sp.examId)) ? Number(sp.examId) : ready[0]?.id ?? null;

  let items: any[] = [];
  let results: any[] = [];
  if (selId) {
    [items, results] = await Promise.all([
      prisma.examItem.findMany({ where: { examId: selId }, orderBy: { no: "asc" } }),
      prisma.examResult.findMany({
        where: { examId: selId },
        include: { student: { select: { id: true, name: true, grade: true, class: { select: { name: true } } } } },
        orderBy: [{ totalScore: "desc" }, { id: "asc" }],
      }),
    ]);
  }

  return (
    <ResultsClient
      dbReady={dbReady}
      exams={ready.map((e) => ({ id: e.id, type: e.type, round: e.round }))}
      selectedExamId={selId}
      items={items.map((i) => ({
        no: i.no,
        answer: i.answer,
        score: i.score,
        area: i.area,
        ability: i.ability,
        note: i.note,
      }))}
      students={students.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        className: s.class?.name ?? null,
      }))}
      results={results.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.name,
        grade: r.student.grade,
        className: r.student.class?.name ?? null,
        takenAt: toYmd(r.takenAt),
        totalScore: r.totalScore,
        comment: r.comment,
        answers: parseAnswers(r.answers),
      }))}
      presetStudentId={sp.studentId ? Number(sp.studentId) : null}
    />
  );
}
