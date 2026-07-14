"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Pencil, Save, Trash2, Users } from "lucide-react";
import { Card, Badge, Button } from "@/components/reading/ui";
import { METRICS } from "@/lib/reading/correction-config";
import { fmtDate } from "@/lib/reading/utils";
import { updateCorrectionResult, deleteCorrection } from "../actions";

export default function CorrectionDetail({ correction: c, peerAvg, peerCount }: any) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.resultText);
  const [pending, start] = useTransition();

  function saveEdit() {
    start(async () => {
      await updateCorrectionResult(c.id, text);
      setEditing(false);
      router.refresh();
    });
  }
  function del() {
    if (!confirm("이 첨삭 기록을 삭제할까요?")) return;
    start(async () => {
      await deleteCorrection(c.id);
      router.push("/reading/corrections");
      router.refresh();
    });
  }

  const tone = c.options?.tone;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 print:hidden">
        <Link href="/reading/corrections" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> 첨삭 목록
        </Link>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="size-4" /> 인쇄</Button>
          {editing ? (
            <Button size="sm" onClick={saveEdit} disabled={pending}><Save className="size-4" /> 저장</Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4" /> 편집</Button>
          )}
          <Button variant="ghost" size="sm" className="text-rose-500" onClick={del} disabled={pending}><Trash2 className="size-4" /></Button>
        </div>
      </div>

      {/* 헤더 */}
      <Card className="p-5 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-extrabold">{c.title}</h2>
          <Badge tone="mint">첨삭 완료</Badge>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {c.student && <Link href={`/reading/students/${c.student.id}`} className="font-semibold text-ink hover:text-brand-700">{c.student.name} {c.student.grade}</Link>}
          {c.genre && <span>{c.genre}</span>}
          {c.gradeLevel && <span>기준 {c.gradeLevel}</span>}
          <span>{fmtDate(c.createdAt, true)}</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* 좌: 답안 + 분석지 */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <h3 className="font-bold text-[15px] mb-3">문제 · 학생 답안</h3>
            {c.problemText && (
              <div className="rounded-lg bg-canvas px-4 py-3 text-[13.5px] mb-2">
                <span className="text-faint text-[12px] font-semibold">문제</span><br />{c.problemText}
              </div>
            )}
            <div className="rounded-lg border border-line px-4 py-3 text-[13.5px] leading-relaxed">
              <span className="text-faint text-[12px] font-semibold">학생 답안</span><br />{c.answerText}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-[15px] mb-3">이든 서술형 분석지</h3>
            {editing ? (
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={18}
                className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-[13.5px] leading-relaxed outline-none focus:border-brand-500 resize-none font-mono" />
            ) : (
              <div className="rounded-xl bg-gradient-to-b from-brand-50/60 to-canvas border border-brand-100 px-5 py-4 text-[13.5px] leading-[1.8] whitespace-pre-line">
                {c.resultText}
              </div>
            )}
          </Card>
        </div>

        {/* 우: 점수 + 동학년 비교 */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-bold text-[15px] mb-3">척도별 점수</h3>
            <div className="space-y-2.5">
              {METRICS.map((m) => {
                const score = c.scores[m.key] ?? 0;
                const peer = peerAvg[m.key];
                return (
                  <div key={m.key}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1">
                      <span className="text-muted">{m.label}</span>
                      <span className="font-bold tabular-nums">{score}점</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-canvas overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${score}%` }} />
                      {peer != null && (
                        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-ink/50" style={{ left: `${peer}%` }} title={`동학년 평균 ${peer}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-[15px] mb-2 inline-flex items-center gap-1.5">
              <Users className="size-4 text-brand-600" /> 동학년 비교
            </h3>
            {peerCount === 0 ? (
              <p className="text-[13px] text-faint">{c.gradeLevel} 비교 대상 첨삭이 아직 없습니다. 첨삭이 쌓이면 문장력·어휘력·구성력 등을 또래와 비교해 보여줍니다.</p>
            ) : (
              <>
                <p className="text-[12.5px] text-muted mb-3">{c.gradeLevel} 다른 학생 {peerCount}건 평균과 비교 (막대의 세로선이 평균)</p>
                <div className="space-y-1.5">
                  {METRICS.map((m) => {
                    const score = c.scores[m.key] ?? 0;
                    const peer = peerAvg[m.key];
                    if (peer == null) return null;
                    const diff = score - peer;
                    return (
                      <div key={m.key} className="flex items-center gap-2 text-[12.5px]">
                        <span className="w-16 text-muted">{m.label}</span>
                        <span className={`ml-auto font-semibold tabular-nums ${diff >= 0 ? "text-mint-600" : "text-rose-500"}`}>
                          {diff >= 0 ? "▲" : "▼"} {Math.abs(diff)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
