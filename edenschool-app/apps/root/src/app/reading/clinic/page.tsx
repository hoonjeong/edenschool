import { prisma } from "@/lib/reading/prisma";
import ClinicClient from "./clinic-client";

export const dynamic = "force-dynamic";

export default async function ClinicPage() {
  const [clinics, students, classes] = await Promise.all([
    prisma.clinic.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: true,
            classId: true,
            class: { select: { name: true } },
          },
        },
        progresses: { select: { week: true, content: true } },
      },
      orderBy: [{ weekday: "asc" }, { time: "asc" }],
    }),
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      select: { id: true, name: true, grade: true },
      orderBy: { name: "asc" },
    }),
    prisma.class.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ClinicClient
      clinics={clinics.map((c) => {
        const progress: Record<number, string> = {};
        for (const p of c.progresses) if (p.content) progress[p.week] = p.content;
        return {
          id: c.id,
          weekday: c.weekday,
          time: c.time,
          endTime: c.endTime,
          subject: c.subject,
          teacher: c.teacher,
          note: c.note,
          studentId: c.studentId,
          studentName: c.student.name,
          grade: c.student.grade,
          classId: c.student.classId,
          className: c.student.class?.name ?? null,
          progress,
        };
      })}
      students={students}
      classes={classes}
    />
  );
}
