import { prisma } from "@/lib/reading/prisma";
import ExamsClient from "./exams-client";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  // DDL(sql/edenbooks-exam.sql) 적용 전이면 조회가 실패한다 → 안내만 띄운다.
  let exams: any[] = [];
  let dbReady = true;
  try {
    exams = await prisma.exam.findMany({
      include: { _count: { select: { items: true, results: true } } },
      orderBy: [{ type: "asc" }, { round: "desc" }],
    });
  } catch (e) {
    console.error("[exam] Exam 조회 실패 — 테이블이 없을 수 있습니다.", e);
    dbReady = false;
  }

  return (
    <ExamsClient
      dbReady={dbReady}
      exams={exams.map((e) => ({
        id: e.id,
        type: e.type,
        round: e.round,
        itemCount: e._count.items,
        resultCount: e._count.results,
      }))}
    />
  );
}
