import { notFound } from "next/navigation";
import { prisma } from "@/lib/reading/prisma";
import ItemsClient from "./items-client";

export const dynamic = "force-dynamic";

export default async function ExamItemsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const examId = Number(id);
  if (!Number.isInteger(examId)) notFound();

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      items: { orderBy: { no: "asc" } },
      _count: { select: { results: true } },
    },
  });
  if (!exam) notFound();

  return (
    <ItemsClient
      exam={{ id: exam.id, type: exam.type, round: exam.round, resultCount: exam._count.results }}
      items={exam.items.map((i) => ({
        no: i.no,
        answer: i.answer,
        score: i.score,
        area: i.area,
        ability: i.ability,
        note: i.note,
      }))}
    />
  );
}
