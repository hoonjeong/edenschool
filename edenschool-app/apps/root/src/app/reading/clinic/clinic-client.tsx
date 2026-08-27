"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Plus, Printer, X, Clock, Check, Layers, Users } from "lucide-react";
import { Card, PageIntro, Button, EmptyState, Badge } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import {
  WEEKDAYS_MON_SAT,
  assignTeacherColors,
  teacherColorOf,
  hhmmToMinutes,
} from "@/lib/reading/utils";
import { ClinicTimeline } from "./ClinicTimeline";
import { addClinic, deleteClinic, upsertClinicProgress, batchUpsertClinicProgress } from "./actions";

const WEEKS = [1, 2, 3, 4];
const printColor = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as const;

function weekdayLabel(n: number) {
  return WEEKDAYS_MON_SAT.find((w) => w.n === n)?.label ?? "";
}

// "YYYY-MM" → "YYYY년 M월"
function ymLabel(ym: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  return m ? `${m[1]}년 ${Number(m[2])}월` : "";
}

// 동시간대 최대 겹침 수

// 서버 페이지(page.tsx)가 만들어 넘기는 모양 그대로.
interface ClinicRow {
  id: number;
  /** 1=월 … 6=토 */
  weekday: number;
  time: string;
  endTime: string | null;
  subject: string;
  teacher: string | null;
  note: string | null;
  studentId: number;
  studentName: string;
  grade: string;
  classId: number | null;
  className: string | null;
  /** 주차(1~4) → 진도 내용 */
  progress: Record<number, string>;
}

interface StudentOption {
  id: number;
  name: string;
  grade: string;
}

interface ClassOption {
  id: number;
  name: string;
}

type Tab = "timetable" | "progress";

function maxConcurrent(clinics: ClinicRow[]): number {
  const events: { t: number; d: number }[] = [];
  for (const c of clinics) {
    const s = hhmmToMinutes(c.time);
    if (s == null) continue;
    const re = hhmmToMinutes(c.endTime);
    const e = re != null && re > s ? re : s + 60;
    events.push({ t: s, d: 1 }, { t: e, d: -1 });
  }
  events.sort((a, b) => a.t - b.t || a.d - b.d);
  let cur = 0;
  let max = 0;
  for (const ev of events) {
    cur += ev.d;
    max = Math.max(max, cur);
  }
  return max;
}

export default function ClinicClient({ clinics, students, classes }: { clinics: ClinicRow[]; students: StudentOption[]; classes: ClassOption[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("timetable");

  return (
    <div>
      <PageIntro
        title="클리닉 시간표"
        desc="담당 선생님별 색상으로 요일 시간표를 한눈에 보고, 주차별 진도를 반 단위로 관리합니다."
      />

      <div className="flex gap-1 mb-4 border-b border-line print:hidden">
        {([
          { k: "timetable", label: "시간표" },
          { k: "progress", label: "주차별 진도" },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${tab === t.k ? "border-brand-600 text-brand-700" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "timetable" ? (
        <TimetableView clinics={clinics} students={students} onRefresh={() => router.refresh()} />
      ) : (
        <ProgressView clinics={clinics} classes={classes} onRefresh={() => router.refresh()} />
      )}
    </div>
  );
}

/* ══════════════ 시간표 탭 (색상 타임라인) ══════════════ */
function TimetableView({ clinics, students, onRefresh }: { clinics: ClinicRow[]; students: StudentOption[]; onRefresh: () => void }) {
  const [day, setDay] = useState(1);
  const [activeTeacher, setActiveTeacher] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [ym, setYm] = useState(""); // 인쇄 헤더용 "YYYY-MM" (마운트 후 현재 월로 설정)
  const [printWeek, setPrintWeek] = useState(1); // 인쇄 기준 주차(1~4)

  useEffect(() => {
    const d = new Date();
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  const dayClinics = useMemo(
    () => clinics.filter((c) => c.weekday === day),
    [clinics, day],
  );

  // 인쇄 진도 목록용: 시간순 정렬
  const dayByTime = useMemo(
    () =>
      [...dayClinics].sort(
        (a, b) =>
          (hhmmToMinutes(a.time) ?? 0) - (hhmmToMinutes(b.time) ?? 0) ||
          a.studentName.localeCompare(b.studentName, "ko"),
      ),
    [dayClinics],
  );

  // 담당 선생님 색상 맵 (해당 요일 기준)
  const colorMap = useMemo(
    () => assignTeacherColors(dayClinics.map((c) => c.teacher)),
    [dayClinics],
  );

  // 요일 변경 시 필터 초기화
  useEffect(() => setActiveTeacher("ALL"), [day]);

  // 선생님별 인원
  const teacherStats = useMemo(() => {
    const m = new Map<string, number>();
    let none = 0;
    for (const c of dayClinics) {
      const t = (c.teacher ?? "").trim();
      if (t) m.set(t, (m.get(t) ?? 0) + 1);
      else none += 1;
    }
    return { list: [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko")), none };
  }, [dayClinics]);

  const concurrent = useMemo(() => maxConcurrent(dayClinics), [dayClinics]);
  const detail = detailId != null ? clinics.find((c) => c.id === detailId) ?? null : null;

  return (
    <div>
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-3 mb-4 print:hidden">
        <label className="inline-flex items-center gap-1.5 text-[13px] text-muted">
          인쇄 기준 월
          <input
            type="month"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            className="h-9 rounded-lg border border-line bg-canvas px-2 text-sm"
          />
        </label>
        <div className="inline-flex items-center gap-1.5 text-[13px] text-muted">
          기준 주차
          <div className="flex gap-1">
            {WEEKS.map((w) => (
              <button
                key={w}
                onClick={() => setPrintWeek(w)}
                className={`h-9 w-12 rounded-lg text-[13px] font-bold transition ${printWeek === w ? "bg-brand-600 text-white shadow-sm" : "bg-surface border border-line text-muted hover:bg-canvas"}`}
              >
                {w}주
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" /> 이 요일 인쇄
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> 클리닉 추가
          </Button>
        </div>
      </div>

      {/* 요일 탭 */}
      <div className="flex gap-1.5 mb-4 print:hidden">
        {WEEKDAYS_MON_SAT.map((w) => {
          const count = clinics.filter((c) => c.weekday === w.n).length;
          return (
            <button
              key={w.n}
              onClick={() => setDay(w.n)}
              className={`flex-1 rounded-xl py-3 font-bold transition ${day === w.n ? "bg-brand-600 text-white shadow-sm" : "bg-surface border border-line text-muted hover:bg-canvas"}`}
            >
              {w.label}
              <span className={`block text-[12px] font-normal mt-0.5 ${day === w.n ? "text-white/80" : "text-faint"}`}>
                {count}명
              </span>
            </button>
          );
        })}
      </div>

      {/* 선생님 필터 칩 + 요약 */}
      {dayClinics.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={() => setActiveTeacher("ALL")}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition ${activeTeacher === "ALL" ? "bg-brand-600 text-white border-brand-600" : "border-line text-muted hover:bg-canvas"}`}
          >
            전체 {dayClinics.length}
          </button>
          {teacherStats.list.map(([name, count]) => {
            const color = teacherColorOf(name, colorMap);
            const on = activeTeacher === name;
            return (
              <button
                key={name}
                onClick={() => setActiveTeacher(on ? "ALL" : name)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition"
                style={{
                  backgroundColor: on ? color.dot : color.bg,
                  color: on ? "#fff" : color.text,
                  borderColor: color.border,
                  ...printColor,
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: on ? "#fff" : color.dot, ...printColor }}
                />
                {name} {count}
              </button>
            );
          })}
          {teacherStats.none > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13px] text-faint">
              담당 미지정 {teacherStats.none}
            </span>
          )}
          <span className="ml-auto text-[12px] text-muted">최대 동시 {concurrent}명</span>
        </div>
      )}

      {/* 화면 타임라인 */}
      <Card className="overflow-hidden print:hidden">
        <div className="px-5 py-3 border-b border-line font-bold flex items-center gap-2">
          <CalendarClock className="size-4 text-brand-600" />
          {weekdayLabel(day)}요일 클리닉
        </div>
        {dayClinics.length === 0 ? (
          <EmptyState icon={<Clock className="size-6" />} title="이 요일에 배정된 클리닉이 없습니다" />
        ) : (
          <div className="overflow-x-auto p-4">
            <ClinicTimeline
              clinics={dayClinics}
              colorMap={colorMap}
              activeTeacher={activeTeacher}
              onSelect={(id) => setDetailId(id)}
            />
          </div>
        )}
      </Card>

      {/* 인쇄 전용: 현재 요일 타임라인 + 시간대별 상세표 */}
      <div className="hidden print:block">
        <h1 className="text-lg font-extrabold mb-1">
          이든 국어 독서교육원 · {ymLabel(ym) && `${ymLabel(ym)} · `}{printWeek}주차 · {weekdayLabel(day)}요일 클리닉 시간표
        </h1>
        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          {teacherStats.list.map(([name]) => {
            const color = teacherColorOf(name, colorMap);
            return (
              <span key={name} className="inline-flex items-center gap-1">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: color.dot, ...printColor }} />
                {name}
              </span>
            );
          })}
        </div>
        {dayClinics.length > 0 && (
          <ClinicTimeline clinics={dayClinics} colorMap={colorMap} activeTeacher="ALL" />
        )}

        {/* 시간대별 상세표: 이름 / 담당 / 등하원 시간 / 진도 / 비고 */}
        {dayByTime.length > 0 && (
          <table className="mt-4 w-full border-collapse text-[11px]">
            <thead>
              <tr className="text-left">
                {["시간(등하원)", "이름", "담당", `진도 (${printWeek}주차)`, "비고"].map((h, i) => (
                  <th
                    key={h}
                    className="border border-ink/70 px-2 py-1 font-bold bg-canvas"
                    style={{ width: ["16%", "14%", "12%", "34%", "24%"][i], ...printColor }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dayByTime.map((c) => {
                const color = teacherColorOf(c.teacher, colorMap);
                return (
                  <tr key={c.id} style={{ breakInside: "avoid" }}>
                    <td className="border border-ink/60 px-2 py-1 tabular-nums whitespace-nowrap">
                      {c.time}
                      {c.endTime ? `~${c.endTime}` : ""}
                    </td>
                    <td className="border border-ink/60 px-2 py-1">
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: color.dot, ...printColor }}
                        />
                        <span className="font-semibold">{c.studentName}</span>
                        {c.grade && <span className="text-faint">{c.grade}</span>}
                      </span>
                    </td>
                    <td className="border border-ink/60 px-2 py-1">{c.teacher ?? ""}</td>
                    <td className="border border-ink/60 px-2 py-1">{c.progress?.[printWeek] ?? ""}</td>
                    <td className="border border-ink/60 px-2 py-1">{c.note ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <AddModal
          students={students}
          defaultDay={day}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            onRefresh();
          }}
        />
      )}
      {detail && (
        <DetailModal
          clinic={detail}
          onClose={() => setDetailId(null)}
          onChanged={onRefresh}
          onDeleted={() => {
            setDetailId(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

/* ══════════════ 주차별 진도 탭 (반 일괄/개별) ══════════════ */
function ProgressView({ clinics, classes, onRefresh }: { clinics: ClinicRow[]; classes: ClassOption[]; onRefresh: () => void }) {
  const [week, setWeek] = useState(1);
  const [classFilter, setClassFilter] = useState("ALL");
  const [bulk, setBulk] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [pending, start] = useTransition();

  // 주차 변경 시 로컬 편집 초기화
  useEffect(() => {
    setDrafts({});
    setBulk("");
  }, [week]);

  const filtered = useMemo(
    () =>
      clinics
        .filter((c) => classFilter === "ALL" || String(c.classId) === classFilter)
        .sort(
          (a, b) =>
            a.weekday - b.weekday ||
            (hhmmToMinutes(a.time) ?? 0) - (hhmmToMinutes(b.time) ?? 0) ||
            a.studentName.localeCompare(b.studentName, "ko"),
        ),
    [clinics, classFilter],
  );

  const valueOf = (c: ClinicRow) => drafts[c.id] ?? c.progress?.[week] ?? "";

  function applyBulk() {
    const ids = filtered.map((c) => c.id);
    if (ids.length === 0) return;
    if (!confirm(`${classFilter === "ALL" ? "전체" : "선택 반"} ${ids.length}건에 ${week}주차 진도를 일괄 적용할까요?\n(각 학생 개별 내용은 덮어써집니다)`)) return;
    start(async () => {
      await batchUpsertClinicProgress(ids, week, bulk);
      setDrafts((prev) => {
        const n = { ...prev };
        for (const c of filtered) n[c.id] = bulk;
        return n;
      });
      onRefresh();
    });
  }

  function saveOne(c: ClinicRow) {
    start(async () => {
      await upsertClinicProgress(c.id, week, valueOf(c));
      onRefresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* 주차 + 반 선택 */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className={labelCls}>주차 선택</label>
            <div className="flex gap-1.5">
              {WEEKS.map((w) => (
                <button
                  key={w}
                  onClick={() => setWeek(w)}
                  className={`h-9 w-14 rounded-lg text-sm font-bold transition ${week === w ? "bg-brand-600 text-white shadow-sm" : "bg-surface border border-line text-muted hover:bg-canvas"}`}
                >
                  {w}주차
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>반 선택</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-9 rounded-lg border border-line bg-canvas px-3 text-sm"
            >
              <option value="ALL">전체 반</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-[13px] text-muted inline-flex items-center gap-1.5">
            <Users className="size-4" /> {filtered.length}건
          </div>
        </div>

        {/* 일괄 적용 */}
        <div className="mt-4 pt-4 border-t border-line">
          <label className={labelCls}>
            <Layers className="inline size-4 mr-1 -mt-0.5 text-brand-600" />
            {week}주차 진도 일괄 입력
          </label>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder={`예: ${week}주차 - 3단원 독해 / 서평 쓰기`}
            />
            <Button onClick={applyBulk} disabled={pending || filtered.length === 0} className="shrink-0">
              <Check className="size-4" /> 일괄 적용
            </Button>
          </div>
          <p className="mt-1.5 text-[12px] text-faint">
            선택한 반(또는 전체) {filtered.length}건 모두에 {week}주차 진도를 동일하게 저장합니다. 이후 학생별로 개별 수정할 수 있습니다.
          </p>
        </div>
      </Card>

      {/* 학생별 목록 (개별 수정) */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-line font-bold text-[14px]">{week}주차 · 학생별 진도</div>
        {filtered.length === 0 ? (
          <EmptyState icon={<Clock className="size-6" />} title="해당 반에 배정된 클리닉이 없습니다" />
        ) : (
          <div className="divide-y divide-line/70">
            {filtered.map((c) => (
              <div key={c.id} className="px-5 py-3 flex flex-wrap items-center gap-3">
                <div className="w-40 shrink-0">
                  <Link href={`/reading/students/${c.studentId}`} className="font-semibold hover:text-brand-700">
                    {c.studentName}
                  </Link>
                  <span className="ml-1.5 text-[12px] text-faint">{c.grade}</span>
                  <div className="text-[12px] text-muted">
                    {weekdayLabel(c.weekday)} {c.time}
                    {c.className && <span className="text-faint"> · {c.className}</span>}
                    {c.teacher && <span className="text-brand-700"> · {c.teacher}</span>}
                  </div>
                </div>
                <input
                  className={inputCls + " flex-1 min-w-[200px]"}
                  value={valueOf(c)}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  placeholder={`${c.studentName} ${week}주차 진도`}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => saveOne(c)}
                  disabled={pending}
                  className="shrink-0"
                >
                  저장
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ══════════════ 상세 모달 (1~4주차 진도 + 삭제) ══════════════ */
function DetailModal({ clinic, onClose, onChanged, onDeleted }: { clinic: ClinicRow; onClose: () => void; onChanged: () => void; onDeleted: () => void }) {
  const [weeks, setWeeks] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const w of WEEKS) init[w] = clinic.progress?.[w] ?? "";
    return init;
  });
  const [pending, start] = useTransition();

  function saveAll() {
    start(async () => {
      for (const w of WEEKS) {
        const cur = clinic.progress?.[w] ?? "";
        if ((weeks[w] ?? "") !== cur) {
          await upsertClinicProgress(clinic.id, w, weeks[w] ?? "");
        }
      }
      onChanged();
      onClose();
    });
  }
  function del() {
    if (!confirm(`${clinic.studentName} 학생의 이 클리닉을 삭제할까요? (주차별 진도도 함께 삭제됩니다)`)) return;
    start(async () => {
      await deleteClinic(clinic.id);
      onDeleted();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${clinic.studentName} · ${weekdayLabel(clinic.weekday)} ${clinic.time}${clinic.endTime ? `~${clinic.endTime}` : ""}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" className="mr-auto text-rose-500" onClick={del} disabled={pending}>
            삭제
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            닫기
          </Button>
          <Button onClick={saveAll} disabled={pending}>
            진도 저장
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5 text-[13px]">
          {clinic.className && <Badge tone="slate">{clinic.className}</Badge>}
          {clinic.subject && <Badge tone="brand">{clinic.subject}</Badge>}
          {clinic.teacher && <Badge tone="sky">{clinic.teacher}</Badge>}
        </div>
        {clinic.note && (
          <div className="rounded-lg bg-canvas px-3 py-2 text-[13px]">
            <span className="text-faint">특이사항</span> · {clinic.note}
          </div>
        )}
        <div>
          <label className={labelCls}>주차별 진도</label>
          <div className="space-y-2">
            {WEEKS.map((w) => (
              <div key={w} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[13px] font-semibold text-brand-700">{w}주차</span>
                <input
                  className={inputCls}
                  value={weeks[w] ?? ""}
                  onChange={(e) => setWeeks((prev) => ({ ...prev, [w]: e.target.value }))}
                  placeholder={`${w}주차 진도`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════ 클리닉 추가 모달 ══════════════ */
function AddModal({ students, defaultDay, onClose, onSaved }: { students: StudentOption[]; defaultDay: number; onClose: () => void; onSaved: () => void }) {
  const [studentId, setStudentId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [weekday, setWeekday] = useState(defaultDay);
  const [time, setTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [subject, setSubject] = useState("독해 클리닉");
  const [teacher, setTeacher] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  const filtered = students.filter((s) => !q || s.name.includes(q));
  const selected = students.find((s) => s.id === studentId);

  function save() {
    if (!studentId) return setErr("학생을 선택하세요.");
    if (!/^\d{2}:\d{2}$/.test(time)) return setErr("시작 시간을 HH:MM 형식으로 입력하세요.");
    if (endTime && !/^\d{2}:\d{2}$/.test(endTime)) return setErr("끝나는 시간을 HH:MM 형식으로 입력하세요.");
    setErr("");
    start(async () => {
      await addClinic({ studentId, weekday, time, endTime, subject, teacher, note });
      onSaved();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="클리닉 추가"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            취소
          </Button>
          <Button onClick={save} disabled={pending}>
            추가
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>학생</label>
          {selected ? (
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="학생 검색" className={inputCls + " mb-2"} />
              <div className="max-h-36 overflow-y-auto rounded-lg border border-line divide-y divide-line/60">
                {filtered.slice(0, 30).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStudentId(s.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50"
                  >
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
              {WEEKDAYS_MON_SAT.map((w) => (
                <option key={w.n} value={w.n}>
                  {w.label}
                </option>
              ))}
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
          <label className={labelCls}>특이사항 (비고)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={inputCls + " h-auto py-2 resize-none"}
            placeholder="숙제, 결석, 학부모 전달사항 등"
          />
        </div>
        <p className="text-[12px] text-faint">진도는 추가 후 「주차별 진도」 탭 또는 타임라인 블록에서 입력합니다.</p>
        {err && <p className="text-[13px] text-rose-500">{err}</p>}
      </div>
    </Modal>
  );
}
