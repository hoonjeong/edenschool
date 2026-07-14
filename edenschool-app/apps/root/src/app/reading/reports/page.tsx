import { prisma } from "@/lib/reading/prisma";
import { getGrowthSeries } from "@/lib/reading/data";
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

  const withObs = students.filter((s) => s._count.observations > 0);
  const selId = sp.studentId ? Number(sp.studentId) : withObs[0]?.id;

  let growth: any[] = [];
  let student: any = null;
  if (selId) {
    student = students.find((s) => s.id === selId);
    growth = await getGrowthSeries(selId);
  }

  return (
    <ReportsClient
      students={students.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        className: s.class?.name ?? null,
        obsCount: s._count.observations,
      }))}
      selectedId={selId ?? null}
      student={student ? { id: student.id, name: student.name, grade: student.grade, className: student.class?.name ?? null } : null}
      growth={growth.map((g) => ({ round: g.round, date: g.date.toISOString(), scores: g.scores, count: g.count }))}
    />
  );
}
