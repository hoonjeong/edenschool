import { notFound } from "next/navigation";
import { prisma } from "@/lib/reading/prisma";
import WriteClient from "./write-client";

export const dynamic = "force-dynamic";

export default async function NewObservationPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const sp = await searchParams;
  const sid = Number(sp.studentId);
  if (!Number.isFinite(sid)) notFound();

  const student = await prisma.student.findUnique({
    where: { id: sid },
    include: { class: true },
  });
  if (!student) notFound();

  const last = await prisma.observation.findFirst({
    where: { studentId: sid },
    orderBy: { round: "desc" },
    select: { round: true },
  });

  return (
    <WriteClient
      student={{
        id: student.id,
        name: student.name,
        grade: student.grade,
        className: student.class?.name ?? null,
      }}
      nextRound={(last?.round ?? 0) + 1}
    />
  );
}
