import { notFound } from "next/navigation";
import { prisma } from "@/lib/reading/prisma";
import { METRICS } from "@/lib/reading/correction-config";
import CorrectionDetail from "./detail-client";

export const dynamic = "force-dynamic";

export default async function CorrectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cid = Number(id);
  if (!Number.isFinite(cid)) notFound();

  const c = await prisma.correction.findUnique({
    where: { id: cid },
    include: { student: { select: { id: true, name: true, grade: true } } },
  });
  if (!c) notFound();

  // 동일 학년 비교(REQ-9): 같은 gradeLevel의 다른 첨삭 평균
  const peers = await prisma.correction.findMany({
    where: { gradeLevel: c.gradeLevel, status: "DONE", id: { not: cid } },
    select: { scores: true },
  });

  const peerAvg: Record<string, number> = {};
  if (peers.length > 0) {
    for (const m of METRICS) {
      let sum = 0, n = 0;
      for (const p of peers) {
        const sc = p.scores as Record<string, number> | null;
        if (sc && typeof sc[m.key] === "number") { sum += sc[m.key]; n++; }
      }
      if (n > 0) peerAvg[m.key] = Math.round(sum / n);
    }
  }

  return (
    <CorrectionDetail
      correction={{
        id: c.id,
        title: c.title,
        genre: c.genre,
        gradeLevel: c.gradeLevel,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        problemText: c.problemText,
        answerText: c.answerText,
        resultText: c.resultText ?? "",
        summary: c.summary,
        scores: (c.scores as Record<string, number>) ?? {},
        options: c.options,
        student: c.student,
      }}
      peerAvg={peerAvg}
      peerCount={peers.length}
    />
  );
}
