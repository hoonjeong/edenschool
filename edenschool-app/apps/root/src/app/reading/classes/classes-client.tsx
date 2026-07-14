"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Users, AlertTriangle, UserPlus, School } from "lucide-react";
import { Card, PageIntro, Badge, Button, EmptyState } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { createClass, updateClass, deleteClass, moveStudent, type ClassInput } from "./actions";

interface Cls {
  id: number;
  name: string;
  schedule: string | null;
  capacity: number;
  color: string;
  teacherId: number | null;
  teacherName: string | null;
  students: { id: number; name: string; grade: string }[];
}
interface Teacher { id: number; name: string; }
interface Stu { id: number; name: string; grade: string; }

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function ClassesClient({ classes, teachers, unassigned }: { classes: Cls[]; teachers: Teacher[]; unassigned: Stu[]; }) {
  const router = useRouter();
  const [modal, setModal] = useState<null | { mode: "create" | "edit"; row?: Cls }>(null);
  const [assignTo, setAssignTo] = useState<Cls | null>(null);

  return (
    <div>
      <PageIntro
        title="반 관리 · 배정"
        desc="반을 만들고 학생을 배정합니다. 정원 초과 시 경고가 표시됩니다."
        action={<Button onClick={() => setModal({ mode: "create" })}><Plus className="size-4" /> 반 추가</Button>}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.map((c) => {
          const over = c.students.length > c.capacity;
          const pct = Math.min(100, Math.round((c.students.length / c.capacity) * 100));
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 size-3 rounded-full shrink-0" style={{ background: c.color }} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[15px]">{c.name}</h3>
                  <div className="text-[13px] text-muted mt-0.5">
                    {c.schedule ?? "시간 미정"} · {c.teacherName ?? "담당 미정"}
                  </div>
                </div>
                <button
                  onClick={() => setModal({ mode: "edit", row: c })}
                  className="grid size-8 place-items-center rounded-lg text-faint hover:bg-canvas hover:text-ink"
                >
                  <Pencil className="size-4" />
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Users className="size-3.5" /> 정원
                  </span>
                  <span className={`font-semibold ${over ? "text-rose-600" : "text-ink"}`}>
                    {c.students.length} / {c.capacity}
                    {over && <AlertTriangle className="inline size-3.5 ml-1 -mt-0.5" />}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-canvas overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: over ? "#f43f5e" : c.color }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 min-h-[28px]">
                {c.students.length === 0 ? (
                  <span className="text-[13px] text-faint">배정된 학생이 없습니다</span>
                ) : (
                  c.students.map((s) => (
                    <Link
                      key={s.id}
                      href={`/reading/students/${s.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-1 text-[12px] hover:bg-brand-50 hover:text-brand-700"
                    >
                      {s.name}<span className="text-faint">{s.grade}</span>
                    </Link>
                  ))
                )}
              </div>

              <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setAssignTo(c)}>
                <UserPlus className="size-4" /> 학생 배정
              </Button>
            </Card>
          );
        })}

        {classes.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <EmptyState icon={<School className="size-6" />} title="아직 반이 없습니다" desc="반을 추가해 학생을 배정하세요." />
          </Card>
        )}
      </div>

      {/* 미배정 학생 */}
      {unassigned.length > 0 && (
        <Card className="mt-5 p-5">
          <h3 className="font-bold text-[15px] mb-3">미배정 학생 <span className="text-faint font-normal">({unassigned.length}명)</span></h3>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map((s) => (
              <Link key={s.id} href={`/reading/students/${s.id}`} className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-700 px-2 py-1 text-[12px]">
                {s.name}<span className="opacity-60">{s.grade}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {modal && (
        <ClassModal
          mode={modal.mode}
          row={modal.row}
          teachers={teachers}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); router.refresh(); }}
        />
      )}
      {assignTo && (
        <AssignModal
          cls={assignTo}
          unassigned={unassigned}
          onClose={() => setAssignTo(null)}
          onSaved={() => { setAssignTo(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function ClassModal({ mode, row, teachers, onClose, onSaved }: any) {
  const [form, setForm] = useState<ClassInput>({
    name: row?.name ?? "",
    schedule: row?.schedule ?? "",
    capacity: row?.capacity ?? 8,
    color: row?.color ?? COLORS[0],
    teacherId: row?.teacherId ?? null,
  });
  const [pending, start] = useTransition();

  function save() {
    if (!form.name.trim()) return;
    start(async () => {
      if (mode === "create") await createClass(form);
      else await updateClass(row.id, form);
      onSaved();
    });
  }
  function del() {
    if (!confirm(`'${row.name}' 반을 삭제할까요? 소속 학생은 미배정으로 전환됩니다.`)) return;
    start(async () => { await deleteClass(row.id); onSaved(); });
  }

  return (
    <Modal open onClose={onClose} title={mode === "create" ? "반 추가" : "반 수정"}
      footer={
        <>
          {mode === "edit" && <Button variant="ghost" className="mr-auto text-rose-500" onClick={del} disabled={pending}>삭제</Button>}
          <Button variant="secondary" onClick={onClose} disabled={pending}>취소</Button>
          <Button onClick={save} disabled={pending}>저장</Button>
        </>
      }>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>반 이름</label>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="월·목 3:00 A반" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>요일·시간</label>
            <input className={inputCls} value={form.schedule ?? ""} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="월·목 15:00" />
          </div>
          <div>
            <label className={labelCls}>정원</label>
            <input type="number" min={1} className={inputCls} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>담당 선생님</label>
          <select className={inputCls} value={form.teacherId ?? ""} onChange={(e) => setForm({ ...form, teacherId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">미정</option>
            {teachers.map((t: Teacher) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>색상</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })}
                className={`size-8 rounded-lg transition ${form.color === c ? "ring-2 ring-offset-2 ring-ink" : ""}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AssignModal({ cls, unassigned, onClose, onSaved }: any) {
  const [pending, start] = useTransition();
  const over = cls.students.length >= cls.capacity;
  function add(sid: number) {
    start(async () => { await moveStudent(sid, cls.id); onSaved(); });
  }
  return (
    <Modal open onClose={onClose} title={`'${cls.name}' 학생 배정`}
      footer={<Button variant="secondary" onClick={onClose}>닫기</Button>}>
      {over && (
        <div className="mb-3 rounded-lg bg-rose-50 text-rose-600 text-[13px] px-3 py-2 inline-flex items-center gap-1.5">
          <AlertTriangle className="size-4" /> 정원({cls.capacity}명)이 찼습니다. 추가 배정 시 초과됩니다.
        </div>
      )}
      <p className="text-[13px] text-muted mb-2">미배정 학생을 눌러 이 반에 추가합니다.</p>
      <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto">
        {unassigned.length === 0 ? (
          <span className="text-[13px] text-faint">미배정 학생이 없습니다.</span>
        ) : (
          unassigned.map((s: Stu) => (
            <button key={s.id} onClick={() => add(s.id)} disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50">
              <Plus className="size-3.5 text-brand-600" />{s.name} <span className="text-faint text-[12px]">{s.grade}</span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
