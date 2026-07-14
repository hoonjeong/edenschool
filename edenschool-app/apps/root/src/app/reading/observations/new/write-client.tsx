"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Save, RotateCcw } from "lucide-react";
import { Card, Button } from "@/components/reading/ui";
import { RUBRIC, type Level } from "@/lib/reading/rubric";
import { createObservation, type ObsItemInput } from "../actions";

type Selection = Record<string, { level: Level; text: string; note: string }>;

export default function WriteClient({ student, nextRound }: { student: any; nextRound: number }) {
  const router = useRouter();
  const [sel, setSel] = useState<Selection>({});
  const [memo, setMemo] = useState("");
  const [pending, start] = useTransition();
  const [activeArea, setActiveArea] = useState(RUBRIC[0].area);

  const itemMap = useMemo(() => {
    const m: Record<string, { area: string; item: string; levels: Record<Level, string> }> = {};
    for (const a of RUBRIC) for (const it of a.items) m[it.key] = { area: a.area, item: it.item, levels: it.levels };
    return m;
  }, []);

  function tap(key: string, level: Level) {
    setSel((prev) => {
      const next = { ...prev };
      if (prev[key]?.level === level) {
        delete next[key]; // 다시 누르면 해제
      } else {
        next[key] = { level, text: itemMap[key].levels[level], note: prev[key]?.note ?? "" };
      }
      return next;
    });
  }
  function setText(key: string, text: string) {
    setSel((p) => ({ ...p, [key]: { ...p[key], text } }));
  }
  function setNote(key: string, note: string) {
    setSel((p) => ({ ...p, [key]: { ...p[key], note } }));
  }

  const count = Object.keys(sel).length;

  function save() {
    if (count === 0) return;
    const items: ObsItemInput[] = Object.entries(sel).map(([key, v]) => ({
      area: itemMap[key].area,
      key,
      item: itemMap[key].item,
      level: v.level,
      text: v.text,
      note: v.note,
    }));
    start(async () => {
      await createObservation({ studentId: student.id, round: nextRound, items, memo });
      router.push(`/reading/students/${student.id}`);
      router.refresh();
    });
  }

  const levelBtn = (key: string, level: Level) => {
    const active = sel[key]?.level === level;
    const tones: Record<Level, string> = {
      상: active ? "bg-mint-500 text-white border-mint-500" : "border-line text-mint-600 hover:bg-mint-50",
      중: active ? "bg-amber-500 text-white border-amber-500" : "border-line text-amber-600 hover:bg-amber-50",
      하: active ? "bg-rose-500 text-white border-rose-500" : "border-line text-rose-600 hover:bg-rose-50",
    };
    return (
      <button key={level} onClick={() => tap(key, level)}
        className={`size-10 rounded-lg border-2 font-bold transition active:scale-95 ${tones[level]}`}>
        {level}
      </button>
    );
  };

  return (
    <div className="pb-24">
      <Link href="/reading/observations" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4">
        <ArrowLeft className="size-4" /> 관찰일지 목록
      </Link>

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold">{student.name}</h2>
            <span className="text-muted">{student.grade}</span>
            <span className="rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-[13px] font-semibold">{nextRound}회차 관찰</span>
          </div>
          <p className="text-[13px] text-muted mt-1">오늘 관찰한 항목만 상/중/하로 탭하세요. 문장이 자동으로 채워집니다.</p>
        </div>
      </div>

      {/* 영역 탭 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {RUBRIC.map((a) => {
          const areaCount = a.items.filter((it) => sel[it.key]).length;
          return (
            <button key={a.area} onClick={() => setActiveArea(a.area)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                activeArea === a.area ? "bg-ink text-white" : "bg-surface border border-line text-muted hover:text-ink"
              }`}>
              <span className="size-2 rounded-full" style={{ background: a.color }} />
              {a.area}
              {areaCount > 0 && <span className={`rounded-full px-1.5 text-[11px] ${activeArea === a.area ? "bg-white/20" : "bg-brand-50 text-brand-700"}`}>{areaCount}</span>}
            </button>
          );
        })}
      </div>

      {/* 항목 카드 */}
      <div className="space-y-3">
        {RUBRIC.filter((a) => a.area === activeArea).flatMap((a) =>
          a.items.map((it) => {
            const chosen = sel[it.key];
            return (
              <Card key={it.key} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[15px]">{it.item}</div>
                    <div className="text-[13px] text-faint mt-0.5">{it.question}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {(["상", "중", "하"] as Level[]).map((lv) => levelBtn(it.key, lv))}
                  </div>
                </div>
                {chosen && (
                  <div className="mt-3 animate-fadeUp">
                    <textarea
                      value={chosen.text}
                      onChange={(e) => setText(it.key, e.target.value)}
                      className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-brand-500 resize-none"
                      rows={2}
                    />
                    <input
                      value={chosen.note}
                      onChange={(e) => setNote(it.key, e.target.value)}
                      placeholder="개별 메모 (선택)"
                      className="mt-2 w-full h-9 rounded-lg border border-line bg-surface px-3 text-[13px] outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </Card>
            );
          }),
        )}
      </div>

      {/* 전체 메모 */}
      <Card className="p-4 mt-4">
        <label className="block text-[13px] font-semibold mb-1.5">종합 메모</label>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3}
          placeholder="이번 관찰의 종합 소견을 적어 주세요."
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-500 resize-none" />
      </Card>

      {/* 하단 고정 저장바 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-7 py-3 flex items-center gap-3">
          <div className="text-sm">
            <span className="font-bold text-brand-700">{count}</span>
            <span className="text-muted"> / 24 항목 관찰됨</span>
          </div>
          {count > 0 && (
            <button onClick={() => setSel({})} className="text-[13px] text-faint hover:text-rose-500 inline-flex items-center gap-1">
              <RotateCcw className="size-3.5" /> 초기화
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <Link href={`/reading/students/${student.id}`}><Button variant="secondary">취소</Button></Link>
            <Button onClick={save} disabled={pending || count === 0}>
              <Save className="size-4" /> 관찰일지 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
