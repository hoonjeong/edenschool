"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  CalendarDays,
  ClipboardList,
  MessageSquareText,
  Sparkles,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, Badge, EmptyState } from "@/components/reading/ui";
import ObservationItems from "@/components/reading/ObservationItems";
import { STUDENT_STATUS, ATTENDANCE_STATUS, CORRECTION_STATUS } from "@/lib/reading/labels";
import { AREA_NAMES, AREA_COLORS } from "@/lib/reading/rubric";
import { fmtDate, fmtDateShort, WEEKDAYS_MON_SAT, relativeDay } from "@/lib/reading/utils";

interface ObsItem {
  area: string;
  item: string;
  level: "상" | "중" | "하";
  text: string;
  note?: string;
}


// 서버 페이지(page.tsx)가 만들어 넘기는 모양 그대로. 날짜는 ISO 문자열로 온다.
interface StudentInfo {
  id: number;
  name: string;
  grade: string;
  phone: string;
  status: "ENROLLED" | "PAUSED" | "WITHDRAWN";
  className: string | null;
  classColor: string | null;
  registeredAt: string;
  memo: string | null;
}

interface AttStat {
  total: number;
  present: number;
  late: number;
  absent: number;
  makeup: number;
}

interface AttendanceRow {
  id: number;
  date: string;
  status: "PRESENT" | "LATE" | "ABSENT" | "MAKEUP";
  checkInAt: string;
  method: string;
}

interface ObservationRow {
  id: number;
  round: number;
  date: string;
  /** DB 상 Json 컬럼(관찰 항목 배열) */
  items: unknown;
  memo: string | null;
}

interface CounselRow {
  id: number;
  date: string;
  type: string;
  content: string;
  nextAction: string | null;
  nextDate: string | null;
}

interface CorrectionRow {
  id: number;
  title: string;
  genre: string | null;
  status: string;
  createdAt: string;
  /** DB 상 Json 컬럼(척도별 점수) */
  scores: unknown;
}

interface ClinicRow {
  id: number;
  weekday: number;
  time: string;
  subject: string;
}

interface GrowthRow {
  round: number;
  /** 영역명 → 점수 */
  scores: Record<string, number | null>;
  count: number;
}

export default function StudentDetail({
  student,
  attStat,
  attendances,
  observations,
  counsels,
  corrections,
  clinics,
  growth,
}: {
  student: StudentInfo;
  attStat: AttStat;
  attendances: AttendanceRow[];
  observations: ObservationRow[];
  counsels: CounselRow[];
  corrections: CorrectionRow[];
  clinics: ClinicRow[];
  growth: GrowthRow[];
}) {
  const [tab, setTab] = useState("attendance");
  const st = STUDENT_STATUS[student.status];
  const rate =
    attStat.total > 0
      ? Math.round(((attStat.total - attStat.absent) / attStat.total) * 100)
      : null;

  const tabs = [
    { key: "attendance", label: "출결", icon: CalendarDays, count: attendances.length },
    { key: "observation", label: "관찰·상담", icon: ClipboardList, count: observations.length + counsels.length },
    { key: "correction", label: "AI 첨삭", icon: Sparkles, count: corrections.length },
    { key: "clinic", label: "클리닉", icon: CalendarClock, count: clinics.length },
  ];

  return (
    <div>
      <Link href="/reading/students" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4">
        <ArrowLeft className="size-4" /> 학생 목록
      </Link>

      {/* 프로필 헤더 */}
      <Card className="p-5 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-brand-100 text-brand-700 text-xl font-extrabold">
            {student.name.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold">{student.name}</h2>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span>{student.grade}</span>
              {student.className && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: student.classColor ?? undefined }} />
                  {student.className}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {student.phone}
              </span>
              <span>등록일 {fmtDate(student.registeredAt, true)}</span>
            </div>
          </div>
          <div className="ml-auto grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-canvas px-5 py-2.5">
              <div className="text-[12px] text-faint">출석률</div>
              <div className="text-xl font-extrabold text-mint-600">{rate == null ? "-" : `${rate}%`}</div>
            </div>
            <div className="rounded-xl bg-canvas px-5 py-2.5">
              <div className="text-[12px] text-faint">관찰 회차</div>
              <div className="text-xl font-extrabold text-brand-600">{growth.length}회</div>
            </div>
          </div>
        </div>
        {student.memo && (
          <div className="mt-4 rounded-lg bg-amber-50 text-amber-700 text-[13px] px-3.5 py-2.5">
            📌 {student.memo}
          </div>
        )}
      </Card>

      {/* 탭 */}
      <div className="flex gap-1 mb-4 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
            <span className="text-[11px] rounded-full bg-canvas px-1.5 py-0.5 text-faint">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "attendance" && <AttendanceTab attStat={attStat} attendances={attendances} rate={rate} />}
      {tab === "observation" && <ObservationTab observations={observations} counsels={counsels} growth={growth} studentId={student.id} />}
      {tab === "correction" && <CorrectionTab corrections={corrections} studentId={student.id} />}
      {tab === "clinic" && <ClinicTab clinics={clinics} />}
    </div>
  );
}

function AttendanceTab({ attStat, attendances, rate }: { attStat: AttStat; attendances: AttendanceRow[]; rate: number | null }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "출석률", value: rate == null ? "-" : `${rate}%`, tone: "text-mint-600" },
          { label: "출석", value: attStat.present, tone: "text-ink" },
          { label: "지각", value: attStat.late, tone: "text-amber-600" },
          { label: "결석", value: attStat.absent, tone: "text-rose-600" },
          { label: "보강", value: attStat.makeup, tone: "text-sky-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-[12px] text-faint">{s.label}</div>
            <div className={`text-2xl font-extrabold mt-0.5 ${s.tone}`}>{s.value}</div>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        {attendances.length === 0 ? (
          <EmptyState icon={<CalendarDays className="size-6" />} title="출결 기록이 없습니다" />
        ) : (
          <div className="divide-y divide-line/70">
            {attendances.map((a) => {
              const s = ATTENDANCE_STATUS[a.status];
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="text-sm font-semibold w-20 tabular-nums">{fmtDateShort(a.date)}</div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <span className="text-[13px] text-faint ml-auto">
                    {a.method === "KEYPAD" ? "태블릿 체크인" : "수동 기록"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function ObservationTab({ observations, counsels, growth }: { observations: ObservationRow[]; counsels: CounselRow[]; growth: GrowthRow[]; studentId: number }) {
  const chartData = growth.map((g) => {
    const row: Record<string, string | number | null> = { name: `${g.round}회` };
    for (const area of AREA_NAMES) row[area] = g.scores[area] ?? null;
    return row;
  });

  return (
    <div className="space-y-4">
      {growth.length >= 1 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-brand-600" />
            <h3 className="font-bold text-[15px]">영역별 성장 추이</h3>
            <span className="text-[12px] text-faint">상3·중2·하1 점수화 (0~100)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {AREA_NAMES.map((area) => (
                  <Line
                    key={area}
                    dataKey={area}
                    stroke={AREA_COLORS[area]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <h3 className="font-bold text-[15px] mb-2 px-1">관찰일지</h3>
          {observations.length === 0 ? (
            <Card><EmptyState icon={<ClipboardList className="size-6" />} title="관찰일지가 없습니다" /></Card>
          ) : (
            <div className="space-y-3">
              {observations.map((o) => (
                <Card key={o.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge tone="brand">{o.round}회차</Badge>
                    <span className="text-[13px] text-muted">{fmtDate(o.date)}</span>
                  </div>
                  {/* 등급에 따라 자동으로 채워진 관찰 문장을 그대로 보여 준다. */}
                  <ObservationItems items={o.items as ObsItem[]} collapsible={false} />
                  {o.memo && (
                    <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[13px] text-muted">
                      <span className="font-semibold text-ink">종합 </span>
                      {o.memo}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold text-[15px] mb-2 px-1">상담 기록</h3>
          {counsels.length === 0 ? (
            <Card><EmptyState icon={<MessageSquareText className="size-6" />} title="상담 기록이 없습니다" /></Card>
          ) : (
            <div className="space-y-3">
              {counsels.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge tone="sky">{c.type}</Badge>
                    <span className="text-[13px] text-muted">{fmtDate(c.date)}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed">{c.content}</p>
                  {c.nextAction && (
                    <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-[12.5px] text-brand-700">
                      다음 액션: {c.nextAction}
                      {c.nextDate && <span className="text-brand-500"> · {relativeDay(c.nextDate)}</span>}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CorrectionTab({ corrections }: { corrections: CorrectionRow[]; studentId: number }) {
  if (corrections.length === 0)
    return <Card><EmptyState icon={<Sparkles className="size-6" />} title="첨삭 이력이 없습니다" desc="AI 첨삭 메뉴에서 답안을 업로드해 첨삭을 시작하세요." /></Card>;
  return (
    <div className="space-y-3">
      {corrections.map((c) => {
        const st = CORRECTION_STATUS[c.status];
        return (
          <Link key={c.id} href={`/reading/corrections/${c.id}`}>
            <Card className="p-4 flex items-center gap-3 hover:border-brand-200 transition-colors">
              <div className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="font-semibold">{c.title}</div>
                <div className="text-[13px] text-faint">{fmtDate(c.createdAt)}{c.genre ? ` · ${c.genre}` : ""}</div>
              </div>
              <Badge tone={st.tone} className="ml-auto">{st.label}</Badge>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function ClinicTab({ clinics }: { clinics: ClinicRow[] }) {
  if (clinics.length === 0)
    return <Card><EmptyState icon={<CalendarClock className="size-6" />} title="클리닉 일정이 없습니다" /></Card>;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {clinics.map((c) => (
        <Card key={c.id} className="p-4 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-mint-50 text-mint-600 font-bold">
            {WEEKDAYS_MON_SAT.find((w) => w.n === c.weekday)?.label}
          </div>
          <div>
            <div className="font-semibold tabular-nums">{c.time}</div>
            <div className="text-[13px] text-muted">{c.subject}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
