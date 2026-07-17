import { prisma } from "@/lib/reading/prisma";
import ClinicClient from "./clinic-client";

export const dynamic = "force-dynamic";

export default async function ClinicPage() {
  const [clinics, students] = await Promise.all([
    prisma.clinic.findMany({
      include: { student: { select: { id: true, name: true, grade: true } } },
      orderBy: [{ weekday: "asc" }, { time: "asc" }],
    }),
    prisma.student.findMany({
      where: { status: "ENROLLED" },
      select: { id: true, name: true, grade: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ClinicClient
      clinics={clinics.map((c) => ({
        id: c.id,
        weekday: c.weekday,
        time: c.time,
        endTime: c.endTime,
        subject: c.subject,
        teacher: c.teacher,
        progress: c.progress,
        note: c.note,
        studentId: c.studentId,
        studentName: c.student.name,
        grade: c.student.grade,
      }))}
      students={students}
    />
  );
}
