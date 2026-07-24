import { prisma } from "@/lib/reading/prisma";
import MakeupClient from "./makeup-client";

export const dynamic = "force-dynamic";

export default async function MakeupPage() {
  const [makeups, students, classes] = await Promise.all([
    prisma.makeupClass.findMany({
      include: {
        student: {
          select: { id: true, name: true, grade: true, class: { select: { name: true } } },
        },
      },
      orderBy: [{ makeupDate: "desc" }, { id: "desc" }],
      take: 500,
    }),
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      select: { id: true, name: true, grade: true, classId: true, class: { select: { name: true } } },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <MakeupClient
      makeups={makeups.map((m) => ({
        id: m.id,
        studentId: m.studentId,
        studentName: m.student.name,
        grade: m.student.grade,
        className: m.student.class?.name ?? null,
        absentDate: m.absentDate.toISOString(),
        makeupDate: m.makeupDate.toISOString(),
        weekday: m.weekday,
        time: m.time,
        attended: m.attended,
        session: m.session,
        progress: m.progress,
        teacher: m.teacher,
        teacherNote: m.teacherNote,
        note: m.note,
      }))}
      students={students.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        classId: s.classId,
        className: s.class?.name ?? null,
      }))}
      classes={classes}
    />
  );
}
