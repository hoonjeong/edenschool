import { prisma } from "@/lib/reading/prisma";
import { getStudentsWithStats } from "@/lib/reading/data";
import StudentsClient from "./students-client";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const [students, classes] = await Promise.all([
    getStudentsWithStats(),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
  ]);

  // 직렬화(Date → 그대로 전달 가능하나 명시적으로 필요한 필드만)
  const rows = students.map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    phone: s.phone,
    status: s.status as string,
    className: s.class?.name ?? null,
    classId: s.classId,
    classColor: s.class?.color ?? null,
    attendanceRate: s.attendanceRate,
    lastCounselAt: s.lastCounselAt ? s.lastCounselAt.toISOString() : null,
    memo: s.memo,
  }));

  return (
    <StudentsClient
      students={rows}
      classes={classes.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
    />
  );
}
