import { notFound } from "next/navigation";
import { prisma } from "@/lib/reading/prisma";
import { getGrowthSeries } from "@/lib/reading/data";
import StudentDetail from "./detail-client";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sid = Number(id);
  if (!Number.isFinite(sid)) notFound();

  const student = await prisma.student.findUnique({
    where: { id: sid },
    include: { class: true },
  });
  if (!student) notFound();

  const [attendances, observations, counsels, corrections, clinics, growth] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId: sid }, orderBy: { date: "desc" }, take: 40 }),
    prisma.observation.findMany({ where: { studentId: sid }, orderBy: { round: "desc" } }),
    prisma.counsel.findMany({ where: { studentId: sid }, orderBy: { date: "desc" } }),
    prisma.correction.findMany({ where: { studentId: sid }, orderBy: { createdAt: "desc" } }),
    prisma.clinic.findMany({ where: { studentId: sid }, orderBy: [{ weekday: "asc" }, { time: "asc" }] }),
    getGrowthSeries(sid),
  ]);

  const attStat = { total: 0, present: 0, late: 0, absent: 0, makeup: 0 };
  for (const a of attendances) {
    attStat.total++;
    if (a.status === "PRESENT") attStat.present++;
    else if (a.status === "LATE") attStat.late++;
    else if (a.status === "ABSENT") attStat.absent++;
    else if (a.status === "MAKEUP") attStat.makeup++;
  }

  return (
    <StudentDetail
      student={{
        id: student.id,
        name: student.name,
        grade: student.grade,
        phone: student.phone,
        status: student.status,
        className: student.class?.name ?? null,
        classColor: student.class?.color ?? null,
        registeredAt: student.registeredAt.toISOString(),
        memo: student.memo,
      }}
      attStat={attStat}
      attendances={attendances.map((a) => ({
        id: a.id,
        date: a.date.toISOString(),
        status: a.status,
        checkInAt: a.checkInAt.toISOString(),
        method: a.method,
      }))}
      observations={observations.map((o) => ({
        id: o.id,
        round: o.round,
        date: o.date.toISOString(),
        items: o.items,
        memo: o.memo,
      }))}
      counsels={counsels.map((c) => ({
        id: c.id,
        date: c.date.toISOString(),
        type: c.type,
        content: c.content,
        nextAction: c.nextAction,
        nextDate: c.nextDate ? c.nextDate.toISOString() : null,
      }))}
      corrections={corrections.map((c) => ({
        id: c.id,
        title: c.title,
        genre: c.genre,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        scores: c.scores,
      }))}
      clinics={clinics.map((c) => ({ id: c.id, weekday: c.weekday, time: c.time, subject: c.subject }))}
      growth={growth.map((g) => ({ round: g.round, scores: g.scores, count: g.count }))}
    />
  );
}
