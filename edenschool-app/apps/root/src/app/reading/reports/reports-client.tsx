"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { TrendingUp, FileBarChart, Printer } from "lucide-react";
import { useState } from "react";
import { Card, PageIntro, EmptyState, Badge, Button } from "@/components/reading/ui";
import { AREA_NAMES, AREA_COLORS } from "@/lib/reading/rubric";
import { fmtDate } from "@/lib/reading/utils";

export default function ReportsClient({ students, selectedId, student, growth, examReports = [] }: any) {
  const router = useRouter();
  // 관찰일지 또는 시험 결과가 있는 학생
  const withData = students.filter((s: any) => s.obsCount > 0 || s.examCount > 0);

  const trendData = growth.map((g: any) => {
    const row: any = { name: `${g.round}회` };
    for (const a of AREA_NAMES) row[a] = g.scores[a] ?? null;
    return row;
  });

  const first = growth[0];

  // 각 영역의 '가장 최근 관찰 점수' 누적 (오늘 관찰한 항목만 입력하는 방식 대응)
  // → 이번 회차에 관찰하지 않은 영역은 이전 회차 값을 그대로 유지, 한 번도 관찰 안 한 영역만 미표시
  const profile: Record<string, number | null> = {};
  for (const a of AREA_NAMES) profile[a] = null;
  for (const g of growth) {
    for (const a of AREA_NAMES) {
      if (g.scores[a] != null) profile[a] = g.scores[a];
    }
  }
  const observedAreas = AREA_NAMES.filter((a) => profile[a] != null);
  const radarData = growth.length
    ? AREA_NAMES.map((a) => ({ area: a.length > 6 ? a.slice(0, 6) : a, fullArea: a, score: profile[a] ?? 0 }))
    : [];

  // 종합 점수(관찰된 영역 평균) / 첫 회차 대비 성장폭
  const avgLatest = observedAreas.length
    ? Math.round(observedAreas.reduce((s, a) => s + (profile[a] as number), 0) / observedAreas.length)
    : null;
  const avgFirst = first
    ? Math.round(
        Object.values(first.scores as Record<string, number>).reduce((a, b) => a + b, 0) /
          Math.max(1, Object.keys(first.scores).length),
      )
    : null;
  const delta = avgLatest != null && avgFirst != null ? avgLatest - avgFirst : null;

  return (
    <div>
      <PageIntro title="성장 리포트" desc="회차별 상/중/하를 점수화(상3·중2·하1)해 영역별 성장 추이를 보여줍니다." />

      <div className="grid lg:grid-cols-4 gap-5">
        {/* 학생 선택 */}
        <Card className="p-3 lg:max-h-[640px] overflow-y-auto">
          <div className="px-2 py-1 text-[12px] font-semibold text-faint uppercase tracking-wider">관찰 · 시험 기록 있는 학생</div>
          {withData.length === 0 ? (
            <p className="text-[13px] text-faint p-3">관찰일지나 시험 결과가 있는 학생이 없습니다.</p>
          ) : (
            <div className="space-y-0.5 mt-1">
              {withData.map((s: any) => (
                <button key={s.id} onClick={() => router.push(`/reading/reports?studentId=${s.id}`)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedId === s.id ? "bg-brand-50 text-brand-700 font-semibold" : "hover:bg-canvas text-muted"
                  }`}>
                  <span>{s.name}</span>
                  <span className="text-[12px] text-faint">{s.grade}</span>
                  <span className="ml-auto flex items-center gap-1">
                    {s.obsCount > 0 && (
                      <span className="text-[11px] rounded-full bg-canvas px-1.5 text-faint">관찰 {s.obsCount}</span>
                    )}
                    {s.examCount > 0 && (
                      <span className="text-[11px] rounded-full bg-brand-50 px-1.5 text-brand-600">시험 {s.examCount}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* 차트 */}
        <div className="lg:col-span-3 space-y-5">
          {!student ? (
            <Card><EmptyState icon={<TrendingUp className="size-6" />} title="학생을 선택하세요" desc="왼쪽에서 학생을 선택하면 성장 추이와 시험 성적이 표시됩니다." /></Card>
          ) : growth.length === 0 ? (
            <Card><EmptyState icon={<TrendingUp className="size-6" />} title="관찰 기록이 없습니다" desc="관찰일지를 작성하면 영역별 성장 추이가 표시됩니다." /></Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 font-extrabold">{student.name.slice(0, 2)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/reading/students/${student.id}`} className="text-lg font-extrabold hover:text-brand-700">{student.name}</Link>
                      <span className="text-muted">{student.grade}</span>
                      {student.className && <Badge tone="brand">{student.className}</Badge>}
                    </div>
                    <div className="text-[13px] text-muted mt-0.5">{growth.length}회 관찰 · 최근 {fmtDate(growth[growth.length - 1].date)}</div>
                  </div>
                  <div className="ml-auto flex gap-3 text-center">
                    <div className="rounded-xl bg-canvas px-5 py-2">
                      <div className="text-[12px] text-faint">종합 점수</div>
                      <div className="text-2xl font-extrabold text-brand-600">{avgLatest}</div>
                    </div>
                    {delta != null && (
                      <div className="rounded-xl bg-canvas px-5 py-2">
                        <div className="text-[12px] text-faint">첫 회차 대비</div>
                        <div className={`text-2xl font-extrabold ${delta >= 0 ? "text-mint-600" : "text-rose-600"}`}>
                          {delta >= 0 ? "+" : ""}{delta}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <div className="grid lg:grid-cols-5 gap-5">
                <Card className="p-5 lg:col-span-3">
                  <h3 className="font-bold text-[15px] mb-3">영역별 성장 추이</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {AREA_NAMES.map((a) => (
                          <Line key={a} dataKey={a} stroke={AREA_COLORS[a]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-5 lg:col-span-2">
                  <h3 className="font-bold text-[15px] mb-1">최근 영역 프로필</h3>
                  <p className="text-[12px] text-faint mb-2">영역별 가장 최근 관찰 점수 (미관찰 영역은 0)</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="70%">
                        <PolarGrid stroke="#e6e8ec" />
                        <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* 영역별 최근 점수 바 */}
              <Card className="p-5">
                <h3 className="font-bold text-[15px] mb-3">영역별 최근 점수</h3>
                <div className="space-y-3">
                  {AREA_NAMES.map((a) => {
                    const score = profile[a];
                    if (score == null) return null;
                    return (
                      <div key={a}>
                        <div className="flex justify-between text-[13px] mb-1">
                          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: AREA_COLORS[a] }} />{a}</span>
                          <span className="font-semibold tabular-nums">{score}점</span>
                        </div>
                        <div className="h-2 rounded-full bg-canvas overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${score}%`, background: AREA_COLORS[a] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}

          {/* ── 시험 성적 리포트 ───────────────────────────── */}
          {student && examReports.length > 0 && <ExamReportSection reports={examReports} />}
          {student && examReports.length === 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-[15px] mb-1">시험 성적 리포트</h3>
              <p className="text-[13px] text-faint">
                입학 테스트 응시 결과가 없습니다. <Link href="/reading/exam-results" className="text-brand-600 hover:underline">시험 결과 입력</Link>에서 답안을 등록하면 이곳에 표시됩니다.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 시험 성적 리포트 ─────────────────────────────────── */
function ExamReportSection({ reports }: { reports: any[] }) {
  const [sel, setSel] = useState(reports.length - 1);
  const r = reports[Math.min(sel, reports.length - 1)];
  const pct = (v: number, f: number) => (f > 0 ? Math.round((v / f) * 100) : 0);

  const areaRadar = r.areas.map((a: any) => ({ key: a.key, 평균: pct(a.avg, a.full), 학생점수: pct(a.score, a.full) }));
  const abilityRadar = r.abilities.map((a: any) => ({ key: a.key, 평균: pct(a.avg, a.full), 학생점수: pct(a.score, a.full) }));
  const trend = reports.map((x: any) => ({ name: x.title, 학생점수: x.score, 평균: x.avg }));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h3 className="font-bold text-[15px] inline-flex items-center gap-1.5">
          <FileBarChart className="size-4 text-brand-600" /> 시험 성적 리포트
        </h3>
        <div className="ml-auto flex flex-wrap gap-1">
          {reports.map((x: any, i: number) => (
            <button
              key={x.id}
              onClick={() => setSel(i)}
              className={`h-8 rounded-lg px-2.5 text-[12px] font-semibold transition ${
                i === Math.min(sel, reports.length - 1)
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted hover:bg-canvas"
              }`}
            >
              {x.title}
            </button>
          ))}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-xl bg-canvas px-5 py-2 text-center">
          <div className="text-[12px] text-faint">학생 점수</div>
          <div className="text-2xl font-extrabold text-brand-600 tabular-nums">
            {r.score}
            <span className="text-[13px] font-semibold text-faint"> / {r.full}</span>
          </div>
        </div>
        <div className="rounded-xl bg-canvas px-5 py-2 text-center">
          <div className="text-[12px] text-faint">응시자 평균</div>
          <div className="text-2xl font-extrabold tabular-nums">{r.avg}</div>
        </div>
        <div className="rounded-xl bg-canvas px-5 py-2 text-center">
          <div className="text-[12px] text-faint">득점률</div>
          <div className="text-2xl font-extrabold tabular-nums">{pct(r.score, r.full)}%</div>
        </div>
        <div className="text-[13px] text-muted">
          응시일 {fmtDate(r.takenAt)}
          {r.peerCount > 1 && ` · 응시자 ${r.peerCount}명`}
        </div>
        <Link href={`/reading/exam-results/${r.id}`} className="ml-auto">
          <Button variant="secondary" size="sm">
            <Printer className="size-4" /> 분석표 보기 · 인쇄
          </Button>
        </Link>
      </div>

      {/* 영역별 · 수준별 레이더 */}
      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-line p-3">
          <h4 className="text-[13px] font-bold mb-1">영역별 점수 (만점 대비 %)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={areaRadar} outerRadius="72%">
                <PolarGrid stroke="#e6e8ec" />
                <PolarAngleAxis dataKey="key" tick={{ fontSize: 11, fill: "#64748b" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="평균" dataKey="평균" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.12} strokeWidth={2} />
                <Radar name="학생점수" dataKey="학생점수" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-line p-3">
          <h4 className="text-[13px] font-bold mb-1">독해능력별 점수 (만점 대비 %)</h4>
          {abilityRadar.length < 3 ? (
            <p className="text-[13px] text-faint p-3">독해능력이 입력된 문항이 부족합니다.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={abilityRadar} outerRadius="72%">
                  <PolarGrid stroke="#e6e8ec" />
                  <PolarAngleAxis dataKey="key" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="평균" dataKey="평균" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
                  <Radar name="학생점수" dataKey="학생점수" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 영역별 막대 */}
      <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {r.areas.map((a: any) => (
          <div key={a.key}>
            <div className="flex justify-between text-[13px] mb-1">
              <span className="font-semibold">{a.key}</span>
              <span className="tabular-nums">
                <b>{a.score}</b>
                <span className="text-faint"> / {a.full}점 · 평균 {a.avg}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-canvas overflow-hidden">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct(a.score, a.full)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* 회차별 점수 추이 */}
      {reports.length > 1 && (
        <div className="mt-5">
          <h4 className="text-[13px] font-bold mb-1">회차별 점수 추이</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="학생점수" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="평균" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}
