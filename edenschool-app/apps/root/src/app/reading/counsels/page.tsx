import { prisma } from "@/lib/reading/prisma";
import CounselsClient from "./counsels-client";

export const dynamic = "force-dynamic";

export default async function CounselsPage() {
  const [counsels, students, upcoming] = await Promise.all([
    prisma.counsel.findMany({
      include: { student: { select: { id: true, name: true, grade: true } } },
      orderBy: { date: "desc" },
      take: 60,
    }),
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      select: { id: true, name: true, grade: true },
      orderBy: { name: "asc" },
    }),
    prisma.counsel.findMany({
      where: { nextDate: { gte: new Date() } },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { nextDate: "asc" },
      take: 10,
    }),
  ]);

  return (
    <CounselsClient
      counsels={counsels.map((c) => ({
        id: c.id,
        studentId: c.studentId,
        studentName: c.student.name,
        grade: c.student.grade,
        date: c.date.toISOString(),
        type: c.type,
        content: c.content,
        nextAction: c.nextAction,
        nextDate: c.nextDate ? c.nextDate.toISOString() : null,
      }))}
      students={students}
      upcoming={upcoming.map((c) => ({
        id: c.id,
        studentId: c.studentId,
        studentName: c.student.name,
        nextDate: c.nextDate!.toISOString(),
        nextAction: c.nextAction,
      }))}
    />
  );
}
