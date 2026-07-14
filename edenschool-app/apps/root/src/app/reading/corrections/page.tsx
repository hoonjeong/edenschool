import Link from "next/link";
import { prisma } from "@/lib/reading/prisma";
import { Card, PageIntro, Badge, Button, EmptyState } from "@/components/reading/ui";
import { CORRECTION_STATUS } from "@/lib/reading/labels";
import { fmtDate } from "@/lib/reading/utils";
import { Sparkles, Plus, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CorrectionsPage() {
  const corrections = await prisma.correction.findMany({
    include: { student: { select: { id: true, name: true, grade: true } } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <div>
      <PageIntro
        title="AI 서술형 첨삭"
        desc="답안 업로드 → 인식 확인 → 옵션 설정 → 첨삭. AI가 초안을, 선생님이 최종본을 만듭니다."
        action={
          <Link href="/reading/corrections/new">
            <Button><Plus className="size-4" /> 새 첨삭</Button>
          </Link>
        }
      />

      {corrections.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Sparkles className="size-6" />}
            title="첨삭 이력이 없습니다"
            desc="답안지를 업로드해 첫 AI 첨삭을 시작하세요."
            action={<Link href="/reading/corrections/new"><Button><Plus className="size-4" /> 새 첨삭</Button></Link>}
          />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {corrections.map((c) => {
            const st = CORRECTION_STATUS[c.status];
            return (
              <Link key={c.id} href={`/reading/corrections/${c.id}`}>
                <Card className="p-4 flex items-start gap-3 hover:border-brand-200 transition-colors h-full">
                  <div className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 shrink-0">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate">{c.title}</span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <div className="text-[13px] text-muted mt-0.5">
                      {c.student ? `${c.student.name} ${c.student.grade}` : "학생 미지정"}
                      {c.genre ? ` · ${c.genre}` : ""} · {fmtDate(c.createdAt)}
                    </div>
                    {c.summary && <p className="text-[13px] text-faint mt-1.5 line-clamp-2">{c.summary}</p>}
                  </div>
                  <ChevronRight className="size-4 text-faint shrink-0 mt-1" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
