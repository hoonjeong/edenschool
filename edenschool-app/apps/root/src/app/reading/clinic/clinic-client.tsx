"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Plus, Printer, X, Clock } from "lucide-react";
import { Card, PageIntro, Button, EmptyState } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { WEEKDAYS_MON_SAT } from "@/lib/reading/utils";
import { addClinic, deleteClinic } from "./actions";

export default function ClinicClient({ clinics, students }: any) {
  const router = useRouter();
  const [day, setDay] = useState(1);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const byDay = (d: number) => clinics.filter((c: any) => c.weekday === d);
  const dayClinics = byDay(day);

  function remove(id: number) {
    start(async () => { await deleteClinic(id); router.refresh(); });
  }

  return (
    <div>
      <PageIntro
        title="클리닉 시간표"
        desc="학생별 요일·시간을 입력하면 요일별 시간표로 자동 정리됩니다."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.print()}><Printer className="size-4" /> 인쇄</Button>
            <Button onClick={() => setOpen(true)}><Plus className="size-4" /> 클리닉 추가</Button>
          </div>
        }
      />

      {/* 요일 탭 */}
      <div className="flex gap-1.5 mb-4 print:hidden">
        {WEEKDAYS_MON_SAT.map((w) => {
          const count = byDay(w.n).length;
          return (
            <button key={w.n} onClick={() => setDay(w.n)}
              className={`flex-1 rounded-xl py-3 font-bold transition ${day === w.n ? "bg-brand-600 text-white shadow-sm" : "bg-surface border border-line text-muted hover:bg-canvas"}`}>
              {w.label}
              <span className={`block text-[12px] font-normal mt-0.5 ${day === w.n ? "text-white/80" : "text-faint"}`}>{count}명</span>
            </button>
          );
        })}
      </div>

      {/* 선택 요일 시간표 (화면) */}
      <div className="print:hidden">
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-line font-bold flex items-center gap-2">
            <CalendarClock className="size-4 text-brand-600" />
            {WEEKDAYS_MON_SAT.find((w) => w.n === day)?.label}요일 클리닉
          </div>
          {dayClinics.length === 0 ? (
            <EmptyState icon={<Clock className="size-6" />} title="이 요일에 배정된 클리닉이 없습니다" />
          ) : (
            <div className="divide-y divide-line/70">
              {dayClinics.map((c: any) => (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 font-bold tabular-nums text-brand-700 shrink-0">
                      {c.time}{c.endTime && <span className="text-faint font-semibold">~{c.endTime}</span>}
                    </div>
                    <Link href={`/reading/students/${c.studentId}`} className="font-semibold hover:text-brand-700">{c.studentName}</Link>
                    <span className="text-[12px] text-faint">{c.grade}</span>
                    <span className="text-[13px] text-muted">{c.subject}</span>
                    {c.teacher && <span className="text-[12px] text-brand-700 bg-brand-50 rounded px-1.5 py-0.5">{c.teacher}</span>}
                    <button onClick={() => remove(c.id)} disabled={pending}
                      className="ml-auto grid size-7 place-items-center rounded-lg text-faint hover:bg-canvas hover:text-rose-500"><X className="size-4" /></button>
                  </div>
                  {(c.progress || c.note) && (
                    <div className="mt-1.5 pl-24 text-[12.5px] text-muted space-y-0.5">
                      {c.progress && <div><span className="text-faint">진도</span> · {c.progress}</div>}
                      {c.note && <div><span className="text-faint">특이사항</span> · {c.note}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 인쇄용: 전체 요일 */}
      <div className="hidden print:block space-y-4">
        <h1 className="text-xl font-extrabold">이든 국어 독서교육원 · 주간 클리닉 시간표</h1>
        {WEEKDAYS_MON_SAT.map((w) => {
          const list = byDay(w.n);
          if (list.length === 0) return null;
          return (
            <div key={w.n}>
              <div className="font-bold border-b border-ink pb-1 mb-2">{w.label}요일</div>
              <div className="space-y-1">
                {list.map((c: any) => (
                  <div key={c.id} className="text-sm py-0.5">
                    <div className="flex gap-3">
                      <span className="w-24 font-semibold tabular-nums shrink-0">{c.time}{c.endTime && `~${c.endTime}`}</span>
                      <span className="font-medium">{c.studentName}</span>
                      <span className="text-faint">{c.grade}</span>
                      <span className="text-muted">{c.subject}</span>
                      {c.teacher && <span className="text-muted">· {c.teacher}</span>}
                    </div>
                    {(c.progress || c.note) && (
                      <div className="pl-24 text-[12px] text-muted">
                        {c.progress && <span>진도: {c.progress}</span>}
                        {c.progress && c.note && <span> / </span>}
                        {c.note && <span>특이사항: {c.note}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {open && <AddModal students={students} defaultDay={day} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); router.refresh(); }} />}
    </div>
  );
}

function AddModal({ students, defaultDay, onClose, onSaved }: any) {
  const [studentId, setStudentId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [weekday, setWeekday] = useState(defaultDay);
  const [time, setTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [subject, setSubject] = useState("독해 클리닉");
  const [teacher, setTeacher] = useState("");
  const [progress, setProgress] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  const filtered = students.filter((s: any) => !q || s.name.includes(q));
  const selected = students.find((s: any) => s.id === studentId);

  function save() {
    if (!studentId) return setErr("학생을 선택하세요.");
    if (!/^\d{2}:\d{2}$/.test(time)) return setErr("시작 시간을 HH:MM 형식으로 입력하세요.");
    if (endTime && !/^\d{2}:\d{2}$/.test(endTime)) return setErr("끝나는 시간을 HH:MM 형식으로 입력하세요.");
    setErr("");
    start(async () => {
      await addClinic({ studentId, weekday, time, endTime, subject, teacher, progress, note });
      onSaved();
    });
  }

  return (
    <Modal open onClose={onClose} title="클리닉 추가"
      footer={<><Button variant="secondary" onClick={onClose} disabled={pending}>취소</Button><Button onClick={save} disabled={pending}>추가</Button></>}>
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="학생 검색" className={inputCls + " mb-2"} />
              <div className="max-h-36 overflow-y-auto rounded-lg border border-line divide-y divide-line/60">
                {filtered.slice(0, 30).map((s: any) => (
                  <button key={s.id} onClick={() => setStudentId(s.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50">
                    {s.name} <span className="text-faint text-[12px]">{s.grade}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>요일</label>
            <select className={inputCls} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
              {WEEKDAYS_MON_SAT.map((w) => <option key={w.n} value={w.n}>{w.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>시작 시간</label>
            <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>끝나는 시간</label>
            <input type="time" className={inputCls} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>과목</label>
            <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option>독해 클리닉</option>
              <option>글쓰기 클리닉</option>
              <option>어휘 클리닉</option>
              <option>클리닉</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>담당 선생님</label>
            <input className={inputCls} value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="예: 김선생" />
          </div>
        </div>
        <div>
          <label className={labelCls}>진도</label>
          <input className={inputCls} value={progress} onChange={(e) => setProgress(e.target.value)} placeholder="예: 3단원 독해 2차시" />
        </div>
        <div>
          <label className={labelCls}>특이사항 (비고)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            className={inputCls + " h-auto py-2 resize-none"} placeholder="숙제, 결석, 학부모 전달사항 등" />
        </div>
        {err && <p className="text-[13px] text-rose-500">{err}</p>}
      </div>
    </Modal>
  );
}
