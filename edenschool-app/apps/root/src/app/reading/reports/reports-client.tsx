"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { TrendingUp, User, Sparkles } from "lucide-react";
import { Card, PageIntro, EmptyState, Badge } from "@/components/reading/ui";
import { AREA_NAMES, AREA_COLORS } from "@/lib/reading/rubric";
import { fmtDate } from "@/lib/reading/utils";

export default function ReportsClient({ students, selectedId, student, growth }: any) {
  const router = useRouter();
  const withObs = students.filter((s: any) => s.obsCount > 0);

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
          <div className="px-2 py-1 text-[12px] font-semibold text-faint uppercase tracking-wider">관찰 기록 있는 학생</div>
          {withObs.length === 0 ? (
            <p className="text-[13px] text-faint p-3">관찰일지가 있는 학생이 없습니다.</p>
          ) : (
            <div className="space-y-0.5 mt-1">
              {withObs.map((s: any) => (
                <button key={s.id} onClick={() => router.push(`/reading/reports?studentId=${s.id}`)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedId === s.id ? "bg-brand-50 text-brand-700 font-semibold" : "hover:bg-canvas text-muted"
                  }`}>
                  <span>{s.name}</span>
                  <span className="text-[12px] text-faint">{s.grade}</span>
                  <span className="ml-auto text-[11px] rounded-full bg-canvas px-1.5 text-faint">{s.obsCount}회</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* 차트 */}
        <div className="lg:col-span-3 space-y-5">
          {!student || growth.length === 0 ? (
            <Card><EmptyState icon={<TrendingUp className="size-6" />} title="관찰 데이터를 선택하세요" desc="왼쪽에서 학생을 선택하면 성장 추이가 표시됩니다." /></Card>
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
        </div>
      </div>
    </div>
  );
}
