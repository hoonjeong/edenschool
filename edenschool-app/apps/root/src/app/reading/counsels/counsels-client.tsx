"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquareText, Plus, CalendarClock, Search } from "lucide-react";
import { Card, PageIntro, Badge, Button, EmptyState } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { fmtDate, relativeDay } from "@/lib/reading/utils";
import { createCounsel, deleteCounsel } from "./actions";

const TYPES = ["정기상담", "학습상담", "생활상담", "학부모상담", "진로상담"];

export default function CounselsClient({ counsels, students, upcoming }: any) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageIntro
        title="상담 기록"
        desc="관찰 결과를 근거로 상담 내용과 다음 액션을 관리합니다."
        action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> 상담 기록</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {counsels.length === 0 ? (
            <Card><EmptyState icon={<MessageSquareText className="size-6" />} title="상담 기록이 없습니다" /></Card>
          ) : (
            <div className="space-y-3">
              {counsels.map((c: any) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/reading/students/${c.studentId}`} className="font-bold hover:text-brand-700">{c.studentName}</Link>
                    <span className="text-[12px] text-faint">{c.grade}</span>
                    <Badge tone="sky">{c.type}</Badge>
                    <span className="text-[13px] text-muted">{fmtDate(c.date)}</span>
                    <button onClick={() => { if (confirm("이 상담 기록을 삭제할까요?")) startDel(c.id, c.studentId, router); }}
                      className="ml-auto text-[12px] text-faint hover:text-rose-500">삭제</button>
                  </div>
                  <p className="text-[13.5px] leading-relaxed">{c.content}</p>
                  {c.nextAction && (
                    <div className="mt-2.5 rounded-lg bg-brand-50 px-3 py-2 text-[13px] text-brand-700">
                      <span className="font-semibold">다음 액션</span> · {c.nextAction}
                      {c.nextDate && <span className="text-brand-500"> ({relativeDay(c.nextDate)})</span>}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <Card className="p-5">
            <h3 className="font-bold text-[15px] mb-3 inline-flex items-center gap-1.5">
              <CalendarClock className="size-4 text-brand-600" /> 예정된 상담·액션
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-[13px] text-faint">예정된 상담이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((u: any) => (
                  <Link key={u.id} href={`/reading/students/${u.studentId}`}
                    className="block rounded-lg bg-canvas px-3 py-2.5 hover:bg-brand-50">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px]">{u.studentName}</span>
                      <Badge tone="brand" className="ml-auto">{relativeDay(u.nextDate)}</Badge>
                    </div>
                    {u.nextAction && <p className="text-[12px] text-muted mt-1 line-clamp-2">{u.nextAction}</p>}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {open && <CounselModal students={students} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); router.refresh(); }} />}
    </div>
  );
}

function startDel(id: number, studentId: number, router: any) {
  deleteCounsel(id, studentId).then(() => router.refresh());
}

function CounselModal({ students, onClose, onSaved }: any) {
  const [studentId, setStudentId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [content, setContent] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  const filtered = students.filter((s: any) => !q || s.name.includes(q));
  const selected = students.find((s: any) => s.id === studentId);

  function save() {
    if (!studentId) return setErr("학생을 선택하세요.");
    if (!content.trim()) return setErr("상담 내용을 입력하세요.");
    setErr("");
    start(async () => {
      await createCounsel({ studentId, type, content, nextAction, nextDate: nextDate || null });
      onSaved();
    });
  }

  return (
    <Modal open onClose={onClose} title="상담 기록 작성" size="lg"
      footer={<><Button variant="secondary" onClick={onClose} disabled={pending}>취소</Button><Button onClick={save} disabled={pending}>저장</Button></>}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>학생</label>
          {selected ? (
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-brand-50 text-brand-700 px-3 py-1.5 text-sm font-semibold">{selected.name} {selected.grade}</span>
              <button onClick={() => setStudentId(null)} className="text-[13px] text-faint hover:text-ink">변경</button>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-faint" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="학생 검색"
                  className={inputCls + " pl-9"} />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-line divide-y divide-line/60">
                {filtered.slice(0, 30).map((s: any) => (
                  <button key={s.id} onClick={() => setStudentId(s.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50">
                    {s.name} <span className="text-faint text-[12px]">{s.grade}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div>
          <label className={labelCls}>상담 유형</label>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold border ${type === t ? "bg-brand-600 text-white border-brand-600" : "border-line text-muted hover:bg-canvas"}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>상담 내용</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className={inputCls + " h-auto py-2 resize-none"} placeholder="상담 내용을 입력하세요." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>다음 액션</label>
            <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} className={inputCls} placeholder="예: 독후감 첨삭 예정" />
          </div>
          <div>
            <label className={labelCls}>다음 상담일</label>
            <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        {err && <p className="text-[13px] text-rose-500">{err}</p>}
      </div>
    </Modal>
  );
}
