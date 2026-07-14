import { prisma } from "@/lib/reading/prisma";
import ObservationsClient from "./observations-client";

export const dynamic = "force-dynamic";

export default async function ObservationsPage() {
  const [observations, students] = await Promise.all([
    prisma.observation.findMany({
      include: { student: { select: { id: true, name: true, grade: true } } },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      select: { id: true, name: true, grade: true, class: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ObservationsClient
      observations={observations.map((o) => ({
        id: o.id,
        studentId: o.studentId,
        studentName: o.student.name,
        grade: o.student.grade,
        round: o.round,
        date: o.date.toISOString(),
        itemCount: Array.isArray(o.items) ? (o.items as unknown[]).length : 0,
        items: o.items,
        memo: o.memo,
      }))}
      students={students.map((s) => ({ id: s.id, name: s.name, grade: s.grade, className: s.class?.name ?? null }))}
    />
  );
}
