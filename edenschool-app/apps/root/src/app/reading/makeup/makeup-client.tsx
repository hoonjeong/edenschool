"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, Plus, Search, X } from "lucide-react";
import { Card, PageIntro, Badge, Button, EmptyState } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { fmtDate, WEEKDAYS } from "@/lib/reading/utils";
import { createMakeup, updateMakeup, deleteMakeup, type MakeupInput } from "./actions";

interface StudentOpt {
  id: number;
  name: string;
  grade: string;
  classId: number | null;
  className: string | null;
}
interface MakeupRow {
  id: number;
  studentId: number;
  studentName: string;
  grade: string;
  className: string | null;
  absentDate: string;
  makeupDate: string;
  weekday: number;
  time: string | null;
  attended: string | null;
  session: string | null;
  progress: string | null;
  teacher: string | null;
  teacherNote: string | null;
  note: string | null;
}

const dash = (v: string | null) => (v && v.trim() ? v : "—");

export default function MakeupClient({
  makeups,
  students,
  classes,
}: {
  makeups: MakeupRow[];
  students: StudentOpt[];
  classes: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MakeupRow | null>(null);

  // 리스트 필터: 이름 검색 + 보강일 날짜 선택
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");

  const filtered = useMemo(() => {
    return makeups.filter((m) => {
      if (q && !m.studentName.includes(q)) return false;
      if (date && m.makeupDate.slice(0, 10) !== date) return false;
      return true;
    });
  }, [makeups, q, date]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(row: MakeupRow) {
    setEditing(row);
    setOpen(true);
  }
  function onSaved() {
    setOpen(false);
    setEditing(null);
    router.refresh();
  }
  function del(row: MakeupRow) {
    if (!confirm(`${row.studentName} 학생의 보강 기록을 삭제할까요?`)) return;
    deleteMakeup(row.id, row.studentId).then(() => router.refresh());
  }

  return (
    <div>
      <PageIntro
        title="보강 수업 관리"
        desc="정규수업 결석에 대한 보강 내역을 기록하고 조회합니다."
        action={
          <Button onClick={openNew}>
            <Plus className="size-4" /> 보강 기록
          </Button>
        }
      />

      {/* 필터 */}
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className={labelCls}>이름 검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="학생 이름"
                className={inputCls + " pl-9"}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>보강일</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          {(q || date) && (
            <button
              onClick={() => {
                setQ("");
                setDate("");
              }}
              className="inline-flex items-center gap-1 text-[13px] text-faint hover:text-ink pb-2.5"
            >
              <X className="size-3.5" /> 필터 초기화
            </button>
          )}
          <span className="ml-auto text-[13px] text-muted pb-2.5">총 {filtered.length}건</span>
        </div>
      </Card>

      {/* 리스트 */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<CalendarPlus className="size-6" />} title="보강 기록이 없습니다" />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] whitespace-nowrap">
              <thead>
                <tr className="bg-canvas text-muted text-left">
                  <Th>학년</Th>
                  <Th>이름</Th>
                  <Th>결석일</Th>
                  <Th>보강일</Th>
                  <Th>요일</Th>
                  <Th>시간</Th>
                  <Th>출석여부</Th>
                  <Th>보강 차시</Th>
                  <Th>진도 외</Th>
                  <Th>보강 담당T</Th>
                  <Th>보강담당T 의견</Th>
                  <Th>비고</Th>
                  <Th> </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-brand-50/40">
                    <Td>{m.grade}</Td>
                    <Td>
                      <Link href={`/reading/students/${m.studentId}`} className="font-semibold hover:text-brand-700">
                        {m.studentName}
                      </Link>
                    </Td>
                    <Td>{fmtDate(m.absentDate)}</Td>
                    <Td>{fmtDate(m.makeupDate)}</Td>
                    <Td>
                      <Badge tone="sky">{WEEKDAYS[m.weekday]}</Badge>
                    </Td>
                    <Td>{dash(m.time)}</Td>
                    <Td>{dash(m.attended)}</Td>
                    <Td>{dash(m.session)}</Td>
                    <Td className="max-w-[240px] whitespace-normal">{dash(m.progress)}</Td>
                    <Td>{dash(m.teacher)}</Td>
                    <Td className="max-w-[200px] whitespace-normal">{dash(m.teacherNote)}</Td>
                    <Td>{dash(m.note)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(m)} className="text-[12px] text-brand-600 hover:underline">
                          수정
                        </button>
                        <button onClick={() => del(m)} className="text-[12px] text-faint hover:text-rose-500">
                          삭제
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {open && (
        <MakeupModal
          students={students}
          classes={classes}
          editing={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2.5 font-semibold border-b border-line">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={"px-3 py-2.5 align-top " + className}>{children}</td>;
}

function weekdayFromDate(d: string): number {
  if (!d) return 1;
  return new Date(d + "T00:00:00").getDay();
}

function MakeupModal({
  students,
  classes,
  editing,
  onClose,
  onSaved,
}: {
  students: StudentOpt[];
  classes: { id: number; name: string }[];
  editing: MakeupRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState<number | null>(editing?.studentId ?? null);

  // 학생 선택 필터 (검색 / 학년 / 반)
  const [q, setQ] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [absentDate, setAbsentDate] = useState(editing ? editing.absentDate.slice(0, 10) : "");
  const [makeupDate, setMakeupDate] = useState(editing ? editing.makeupDate.slice(0, 10) : "");
  const [weekday, setWeekday] = useState<number>(editing?.weekday ?? 1);
  const [time, setTime] = useState(editing?.time ?? "");
  const [attended, setAttended] = useState(editing?.attended ?? "");
  const [session, setSession] = useState(editing?.session ?? "");
  const [progress, setProgress] = useState(editing?.progress ?? "");
  const [teacher, setTeacher] = useState(editing?.teacher ?? "");
  const [teacherNote, setTeacherNote] = useState(editing?.teacherNote ?? "");
  const [note, setNote] = useState(editing?.note ?? "");

  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  const grades = useMemo(() => Array.from(new Set(students.map((s) => s.grade))).sort(), [students]);

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        if (q && !s.name.includes(q)) return false;
        if (gradeFilter && s.grade !== gradeFilter) return false;
        if (classFilter && String(s.classId) !== classFilter) return false;
        return true;
      }),
    [students, q, gradeFilter, classFilter]
  );

  const selected = students.find((s) => s.id === studentId) ?? (editing ? { name: editing.studentName, grade: editing.grade } : null);

  function onMakeupDateChange(v: string) {
    setMakeupDate(v);
    if (v) setWeekday(weekdayFromDate(v));
  }

  function save() {
    if (!studentId) return setErr("학생을 선택하세요.");
    if (!absentDate) return setErr("결석일을 입력하세요.");
    if (!makeupDate) return setErr("보강일을 입력하세요.");
    setErr("");
    const input: MakeupInput = {
      studentId,
      absentDate,
      makeupDate,
      weekday,
      time,
      attended,
      session,
      progress,
      teacher,
      teacherNote,
      note,
    };
    start(async () => {
      if (editing) await updateMakeup(editing.id, input);
      else await createMakeup(input);
      onSaved();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "보강 기록 수정" : "보강 기록 작성"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            취소
          </Button>
          <Button onClick={save} disabled={pending}>
            저장
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 학생 선택 */}
        <div>
          <label className={labelCls}>학생</label>
          {selected && studentId ? (
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-brand-50 text-brand-700 px-3 py-1.5 text-sm font-semibold">
                {selected.name} {selected.grade}
              </span>
              <button onClick={() => setStudentId(null)} className="text-[13px] text-faint hover:text-ink">
                변경
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-faint" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="이름 검색"
                    className={inputCls + " pl-9"}
                  />
                </div>
                <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={inputCls + " w-auto"}>
                  <option value="">학년 전체</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={inputCls + " w-auto"}>
                  <option value="">반 전체</option>
                  {classes.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-line divide-y divide-line/60">
                {filteredStudents.length === 0 ? (
                  <p className="px-3 py-3 text-[13px] text-faint">해당하는 학생이 없습니다.</p>
                ) : (
                  filteredStudents.slice(0, 50).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStudentId(s.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50"
                    >
                      {s.name} <span className="text-faint text-[12px]">{s.grade}</span>
                      {s.className && <span className="text-faint text-[12px]"> · {s.className}</span>}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* 날짜 · 요일 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>결석일</label>
            <input type="date" value={absentDate} onChange={(e) => setAbsentDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>보강일</label>
            <input type="date" value={makeupDate} onChange={(e) => onMakeupDateChange(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>보강요일</label>
            <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className={inputCls}>
              {WEEKDAYS.map((w, i) => (
                <option key={i} value={i}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 시간 · 출석여부 · 보강 차시 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>시간</label>
            <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="예: 16:00~17:00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>출석여부</label>
            <input value={attended} onChange={(e) => setAttended(e.target.value)} placeholder="예: 출석" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>보강 차시</label>
            <input value={session} onChange={(e) => setSession(e.target.value)} placeholder="예: 3차시" className={inputCls} />
          </div>
        </div>

        {/* 진도 외 */}
        <div>
          <label className={labelCls}>진도 외</label>
          <textarea
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            rows={3}
            className={inputCls + " h-auto py-2 resize-none"}
            placeholder="진도 외 내용을 입력하세요."
          />
        </div>

        {/* 담당T · 의견 · 비고 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>보강 담당T</label>
            <input value={teacher} onChange={(e) => setTeacher(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>보강 담당T 의견</label>
            <input value={teacherNote} onChange={(e) => setTeacherNote(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>비고</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </div>
        </div>

        {err && <p className="text-[13px] text-rose-500">{err}</p>}
      </div>
    </Modal>
  );
}
