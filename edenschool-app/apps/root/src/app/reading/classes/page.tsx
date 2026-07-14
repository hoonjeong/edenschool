import { prisma } from "@/lib/reading/prisma";
import ClassesClient from "./classes-client";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const [classes, teachers, unassigned] = await Promise.all([
    prisma.class.findMany({
      include: {
        teacher: true,
        students: {
          where: { status: "ENROLLED" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, grade: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.student.findMany({
      where: { status: "ENROLLED", classId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, grade: true },
    }),
  ]);

  return (
    <ClassesClient
      classes={classes.map((c) => ({
        id: c.id,
        name: c.name,
        schedule: c.schedule,
        capacity: c.capacity,
        color: c.color,
        teacherId: c.teacherId,
        teacherName: c.teacher?.name ?? null,
        students: c.students,
      }))}
      teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
      unassigned={unassigned}
    />
  );
}
