"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ScanLine, CalendarDays, AlertTriangle, Users } from "lucide-react";
import { Card, PageIntro, StatCard, Badge, Button, EmptyState } from "@/components/reading/ui";
import { ATTENDANCE_STATUS } from "@/lib/reading/labels";
import { setAttendance, clearAttendance } from "./actions";

const STATUS_ORDER = ["PRESENT", "LATE", "ABSENT", "MAKEUP"] as const;

export default function AttendanceClient({ dateStr, isToday, rows, summary, classStats, absentAlerts }: any) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState("ALL");

  function shiftDate(delta: number) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const ns = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    router.push(`/reading/attendance?date=${ns}`);
  }

  function set(studentId: number, status: string) {
    start(async () => {
      await setAttendance(studentId, dateStr, status as any);
      router.refresh();
    });
  }
  function clear(studentId: number) {
    start(async () => {
      await clearAttendance(studentId, dateStr);
      router.refresh();
    });
  }

  const filtered = rows.filter((r: any) => {
    if (filter === "ALL") return true;
    if (filter === "NONE") return !r.status;
    return r.status === filter;
  });

  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "long", day: "numeric", weekday: "short",
  }).format(new Date(dateStr + "T00:00:00"));

  return (
    <div>
      <PageIntro
        title="출결 관리"
        desc="날짜별 출결 현황을 확인하고 수동으로 보정할 수 있습니다."
        action={
          <Link href="/reading/checkin">
            <Button><ScanLine className="size-4" /> 체크인 화면 열기</Button>
          </Link>
        }
      />

      {/* 요약 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <StatCard label="등원 완료" value={summary.checked} sub={`전체 ${summary.total}명 중`} tone="mint" icon={<Users className="size-5" />} />
        <StatCard label="출석" value={summary.present} tone="mint" />
        <StatCard label="지각" value={summary.late} tone="amber" />
        <StatCard label="결석" value={summary.absent} tone="rose" />
        <StatCard label="미등원" value={summary.total - summary.checked} tone="slate" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* 출결 리스트 */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 p-3 border-b border-line">
              <button onClick={() => shiftDate(-1)} className="grid size-9 place-items-center rounded-lg hover:bg-canvas text-muted">
                <ChevronLeft className="size-5" />
              </button>
              <div className="flex items-center gap-2 font-bold">
                <CalendarDays className="size-4 text-brand-600" />
                {dateLabel}
                {isToday && <Badge tone="brand">오늘</Badge>}
              </div>
              <button onClick={() => shiftDate(1)} className="grid size-9 place-items-center rounded-lg hover:bg-canvas text-muted">
                <ChevronRight className="size-5" />
              </button>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}
                className="ml-auto h-9 rounded-lg border border-line bg-canvas px-2 text-[13px] outline-none">
                <option value="ALL">전체</option>
                <option value="NONE">미등원</option>
                <option value="PRESENT">출석</option>
                <option value="LATE">지각</option>
                <option value="ABSENT">결석</option>
                <option value="MAKEUP">보강</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={<Users className="size-6" />} title="해당 조건의 학생이 없습니다" />
            ) : (
              <div className="divide-y divide-line/70 max-h-[560px] overflow-y-auto">
                {filtered.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Link href={`/reading/students/${r.id}`} className="min-w-0 flex items-center gap-2 hover:text-brand-700">
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-[12px] text-faint">{r.grade}</span>
                      {r.className && (
                        <span className="hidden sm:inline text-[12px] text-faint">
                          · {r.className}
                        </span>
                      )}
                    </Link>
                    <div className="ml-auto flex items-center gap-1">
                      {STATUS_ORDER.map((s) => {
                        const meta = ATTENDANCE_STATUS[s];
                        const active = r.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => set(r.id, s)}
                            disabled={pending}
                            className={`h-8 px-2.5 rounded-lg text-[12px] font-semibold transition ${
                              active
                                ? { mint: "bg-mint-500 text-white", amber: "bg-amber-500 text-white", rose: "bg-rose-500 text-white", sky: "bg-sky-500 text-white" }[meta.tone]
                                : "text-muted hover:bg-canvas"
                            }`}
                          >
                            {meta.label}
                          </button>
                        );
                      })}
                      {r.status && (
                        <button onClick={() => clear(r.id)} disabled={pending}
                          className="h-8 px-2 rounded-lg text-[12px] text-faint hover:text-rose-500 hover:bg-canvas">
                          해제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 통계 사이드 */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-bold text-[15px] mb-3">반별 출석률 <span className="text-faint font-normal text-[12px]">최근 30일</span></h3>
            <div className="space-y-3">
              {classStats.map((c: any) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-[13px] mb-1">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: c.color }} />{c.name}
                    </span>
                    <span className="font-semibold tabular-nums">{c.rate == null ? "-" : `${c.rate}%`}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-canvas overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.rate ?? 0}%`, background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-[15px] mb-3 inline-flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-amber-500" /> 결석 알림
            </h3>
            {absentAlerts.length === 0 ? (
              <p className="text-[13px] text-faint">최근 30일 내 결석 3회 이상 학생이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {absentAlerts.map((s: any) => (
                  <Link key={s.id} href={`/reading/students/${s.id}`}
                    className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[13px] hover:bg-rose-100">
                    <span className="font-semibold text-rose-700">{s.name}</span>
                    <span className="text-rose-400">{s.className}</span>
                    <span className="ml-auto font-bold text-rose-600">결석 {s.absent}회</span>
                  </Link>
                ))}
                <p className="text-[12px] text-faint mt-1">상담·공지 발송 대상으로 검토하세요.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
