import { notFound } from "next/navigation";
import { prisma } from "@/lib/reading/prisma";
import { METRICS } from "@/lib/reading/correction-config";
import { toImagePaths } from "@/lib/reading/correction-images";
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

  // 동일 학년 비교(REQ-9): 같은 gradeLevel의 '다른 학생' 첨삭 평균.
  // 자기 자신은 물론, 같은 학생의 과거 첨삭도 평균에서 제외해야 '또래 비교'가 된다.
  // 학년 정보가 없으면 비교 자체가 성립하지 않으므로 건너뛴다.
  const peers = c.gradeLevel
    ? await prisma.correction.findMany({
        where: {
          gradeLevel: c.gradeLevel,
          status: "DONE",
          id: { not: cid },
          // 학생 미지정 첨삭은 누구의 것인지 알 수 없어 또래 표본에서 제외한다.
          studentId: c.studentId != null ? { not: c.studentId } : { not: null },
        },
        select: { scores: true },
      })
    : [];

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
        imageCount: toImagePaths(c.images).length,
      }}
      peerAvg={peerAvg}
      peerCount={peers.length}
    />
  );
}
