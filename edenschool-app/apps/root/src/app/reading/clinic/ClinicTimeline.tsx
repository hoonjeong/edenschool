"use client";

import { useMemo } from "react";
import {
  teacherColorOf,
  hhmmToMinutes,
  minutesToHhmm,
  type TeacherColor,
} from "@/lib/reading/utils";

export interface TimelineClinic {
  id: number;
  time: string;
  endTime?: string | null;
  studentName: string;
  grade?: string | null;
  subject?: string | null;
  teacher?: string | null;
}

const DEFAULT_DURATION = 60; // endTime 없을 때 기본 60분
const printColor = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as const;

function span(c: TimelineClinic): { start: number; end: number } | null {
  const start = hhmmToMinutes(c.time);
  if (start == null) return null;
  const rawEnd = hhmmToMinutes(c.endTime);
  const end = rawEnd != null && rawEnd > start ? rawEnd : start + DEFAULT_DURATION;
  return { start, end };
}

export function ClinicTimeline({
  clinics,
  colorMap,
  activeTeacher = "ALL",
  onSelect,
}: {
  clinics: TimelineClinic[];
  colorMap: Map<string, TeacherColor>;
  activeTeacher?: string; // "ALL" | 선생님명
  onSelect?: (id: number) => void;
}) {
  const rows = useMemo(() => {
    return clinics
      .map((c) => ({ c, s: span(c) }))
      .filter((r): r is { c: TimelineClinic; s: { start: number; end: number } } => r.s !== null)
      .sort((a, b) => a.s.start - b.s.start || a.c.studentName.localeCompare(b.c.studentName, "ko"));
  }, [clinics]);

  const bounds = useMemo(() => {
    if (rows.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const r of rows) {
      min = Math.min(min, r.s.start);
      max = Math.max(max, r.s.end);
    }
    min = Math.floor(min / 60) * 60;
    max = Math.ceil(max / 60) * 60;
    if (max <= min) max = min + 60;
    return { min, max, range: max - min };
  }, [rows]);

  if (!bounds) {
    return (
      <div className="py-14 text-center text-[13px] text-faint">이 요일에 배정된 클리닉이 없습니다.</div>
    );
  }

  const { min, max, range } = bounds;
  const ticks: number[] = [];
  for (let m = min; m <= max; m += 60) ticks.push(m);

  const pct = (m: number) => ((m - min) / range) * 100;

  return (
    <div className="min-w-[640px]">
      {/* 시간축 눈금 */}
      <div className="relative h-6 ml-2 mr-2 border-b border-line">
        {ticks.map((m) => (
          <div
            key={m}
            className="absolute top-0 -translate-x-1/2 text-[11px] tabular-nums text-faint"
            style={{ left: `${pct(m)}%` }}
          >
            {minutesToHhmm(m)}
          </div>
        ))}
      </div>

      {/* 행 */}
      <div className="relative ml-2 mr-2">
        {/* 세로 눈금선 */}
        <div className="pointer-events-none absolute inset-0">
          {ticks.map((m) => (
            <div
              key={m}
              className="absolute top-0 bottom-0 w-px bg-line/60"
              style={{ left: `${pct(m)}%` }}
            />
          ))}
        </div>

        <div className="relative py-1 space-y-[3px]">
          {rows.map(({ c, s }) => {
            const color = teacherColorOf(c.teacher, colorMap);
            const dim = activeTeacher !== "ALL" && (c.teacher ?? "").trim() !== activeTeacher;
            const left = pct(s.start);
            const width = Math.max(((s.end - s.start) / range) * 100, 3);
            return (
              <div key={c.id} className="relative h-7">
                <button
                  type="button"
                  onClick={() => onSelect?.(c.id)}
                  title={`${c.studentName} · ${c.time}${c.endTime ? `~${c.endTime}` : ""}${c.teacher ? ` · ${c.teacher}` : ""}${c.subject ? ` · ${c.subject}` : ""}`}
                  className={`absolute top-0 h-7 flex items-center gap-1 rounded-md border px-2 text-[12px] font-semibold whitespace-nowrap overflow-visible transition ${dim ? "opacity-25 print:opacity-100" : "opacity-100 hover:brightness-95"}`}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: color.bg,
                    color: color.text,
                    borderColor: color.border,
                    ...printColor,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color.dot, ...printColor }}
                  />
                  <span>{c.studentName}</span>
                  {c.grade && <span className="font-normal opacity-70">{c.grade}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
