"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";
import { ArrowLeft, Printer, Save, Check } from "lucide-react";
import { Button } from "@/components/reading/ui";
import { examTitle } from "@/lib/reading/exam";
import { fmtDate } from "@/lib/reading/utils";
import { saveExamComment } from "../actions";

const printColor = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as const;

interface Group {
  key: string;
  full: number;
  score: number;
  avg: number;
}
interface Row {
  no: number;
  answer: number;
  given: number | null;
  correct: boolean;
  wrongRate: number | null;
  area: string;
  ability: string | null;
  note: string | null;
}

export default function ReportSheet({
  result,
  exam,
  student,
  full,
  avgTotal,
  peerCount,
  areas,
  abilities,
  rows,
}: {
  result: { id: number; takenAt: string; totalScore: number; comment: string | null };
  exam: { id: number; type: string; round: number };
  student: { id: number; name: string; grade: string; className: string | null };
  full: number;
  avgTotal: number;
  peerCount: number;
  areas: Group[];
  abilities: Group[];
  rows: Row[];
}) {
  const [comment, setComment] = useState(result.comment ?? "");
  const [saved, setSaved] = useState(false);
  const [busy, start] = useTransition();

  function saveComment() {
    start(async () => {
      await saveExamComment(result.id, comment);
      setSaved(true);
    });
  }

  const pct = (v: number, f: number) => (f > 0 ? Math.round((v / f) * 100) : 0);
  const areaRadar = areas.map((a) => ({ key: a.key, 평균: pct(a.avg, a.full), 학생점수: pct(a.score, a.full) }));
  const abilityRadar = abilities.map((a) => ({ key: a.key, 평균: pct(a.avg, a.full), 학생점수: pct(a.score, a.full) }));

  return (
    <div>
      {/* 화면 전용 도구 모음 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Link href="/reading/exam-results">
          <Button variant="ghost">
            <ArrowLeft className="size-4" /> 결과 입력으로
          </Button>
        </Link>
        <span className="text-[13px] text-muted">
          {examTitle(exam.type, exam.round)} · {student.name} · 응시 {fmtDate(result.takenAt)}
          {peerCount > 1 && ` · 응시자 ${peerCount}명 기준 평균`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" onClick={saveComment} disabled={busy}>
            {saved ? <Check className="size-4" /> : <Save className="size-4" />} 종합의견 저장
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" /> 인쇄 (A4 2장)
          </Button>
        </div>
      </div>

      {/* A4 용지 크기 고정 — 화면과 인쇄가 같은 레이아웃 */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { background: #fff; }
        }
        .a4 { width: 210mm; min-height: 296mm; padding: 12mm 12mm 10mm; background: #fff; }
        @media print { .a4 { box-shadow: none !important; margin: 0 !important; break-after: page; } .a4:last-child { break-after: auto; } }
        .rpt-table { width: 100%; border-collapse: collapse; }
        .rpt-table th, .rpt-table td { border: 1px solid #94a3b8; padding: 2px 4px; text-align: center; }
        .rpt-table th { background: #f1f5f9; font-weight: 700; }
      `}</style>

      <div className="flex flex-col items-center gap-6 print:gap-0">
        {/* ── 1장: 기본정보 · 시험성적 · 영역별 · 수준별 ───────── */}
        <div className="a4 shadow-[var(--shadow-card)] rounded-sm print:rounded-none" style={printColor}>
          <h1 className="text-center text-[22px] font-extrabold tracking-tight">문해력 진단 평가 분석표</h1>
          <p className="mt-1 text-center text-[12px] text-muted">
            {examTitle(exam.type, exam.round)} · 응시일 {fmtDate(result.takenAt, true)}
          </p>

          {/* 1~5 기본 정보 */}
          <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-1.5 text-[13px]">
            <Field label="1. 이　　름" value={student.name} />
            <Field label="4. 진로 목표" value="" />
            <Field label="2. 학　　교" value="" />
            <Field label="5. 반 배 정" value={student.className ?? ""} />
            <Field label="3. 학　　년" value={student.grade} />
            <div />
          </div>

          {/* 4. 시험성적 */}
          <SectionTitle>4. 시험성적</SectionTitle>
          <table className="rpt-table text-[12px]" style={{ width: "70%" }}>
            <thead>
              <tr style={printColor}>
                <th style={printColor}>총점</th>
                <th style={{ ...printColor, color: "#dc2626" }}>학생점수</th>
                <th style={printColor}>응시자 평균</th>
                <th style={printColor}>득점률</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{full}</td>
                <td style={{ color: "#dc2626", fontWeight: 700, ...printColor }}>{result.totalScore}</td>
                <td>{avgTotal}</td>
                <td>{pct(result.totalScore, full)}%</td>
              </tr>
            </tbody>
          </table>

          {/* 5. 영역별 점수 */}
          <SectionTitle>5. 영역별 점수</SectionTitle>
          <ScoreTable groups={areas} head="영역" />
          <ChartBox data={areaRadar} />

          {/* 6. 수준별 점수 */}
          <SectionTitle>6. 수준별 점수</SectionTitle>
          {abilities.length === 0 ? (
            <p className="text-[12px] text-muted">독해능력이 입력된 문항이 없습니다.</p>
          ) : (
            <>
              <ScoreTable groups={abilities} head="구분" />
              <ChartBox data={abilityRadar} />
            </>
          )}
        </div>

        {/* ── 2장: 정오표 · 종합의견 ─────────────────────────── */}
        <div className="a4 shadow-[var(--shadow-card)] rounded-sm print:rounded-none" style={printColor}>
          <div className="flex items-baseline gap-2">
            <h2 className="text-[15px] font-extrabold">7. 정오표</h2>
            <span className="text-[11px] text-muted">
              {student.name} · {examTitle(exam.type, exam.round)}
              {peerCount > 1 && ` · 오답률은 응시자 ${peerCount}명 기준`}
            </span>
          </div>
          <table className="rpt-table mt-2 text-[11px]">
            <thead>
              <tr style={printColor}>
                <th style={{ ...printColor, width: "8%" }}>문제번호</th>
                <th style={{ ...printColor, width: "7%" }}>정답</th>
                <th style={{ ...printColor, width: "7%" }}>작성</th>
                <th style={{ ...printColor, width: "7%" }}>결과</th>
                <th style={{ ...printColor, width: "9%" }}>오답률</th>
                <th style={{ ...printColor, width: "13%" }}>영역</th>
                <th style={{ ...printColor, width: "14%" }}>독해능력</th>
                <th style={printColor}>문항 설명</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.no}>
                  <td>{r.no}</td>
                  <td>{r.answer}</td>
                  <td>{r.given ?? "-"}</td>
                  <td
                    style={{
                      ...printColor,
                      background: r.correct ? undefined : "#fee2e2",
                      color: r.correct ? undefined : "#dc2626",
                      fontWeight: 700,
                    }}
                  >
                    {r.correct ? "O" : "X"}
                  </td>
                  <td
                    style={{
                      ...printColor,
                      background: !r.correct && (r.wrongRate ?? 0) >= 50 ? "#fecaca" : undefined,
                    }}
                  >
                    {r.wrongRate == null ? "-" : `${r.wrongRate}%`}
                  </td>
                  <td>{r.area}</td>
                  <td>{r.ability ?? ""}</td>
                  <td style={{ textAlign: "left" }}>{r.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="mt-5 text-[15px] font-extrabold">8. 종합의견</h2>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setSaved(false);
            }}
            rows={8}
            placeholder="종합의견을 입력하세요. (저장 후 인쇄됩니다)"
            className="mt-2 w-full rounded-sm border border-slate-400 p-3 text-[12px] leading-relaxed outline-none focus:border-brand-500 print:resize-none"
            style={printColor}
          />
          <p className="mt-1 text-[11px] text-faint print:hidden">
            위 도구 모음의 <b>종합의견 저장</b>을 눌러야 내용이 보관됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-slate-300 pb-1">
      <span className="font-semibold whitespace-pre">{label} :</span>
      <span>{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-5 mb-2 text-[15px] font-extrabold">{children}</h2>;
}

function ScoreTable({ groups, head }: { groups: Group[]; head: string }) {
  return (
    <table className="rpt-table text-[12px]">
      <thead>
        <tr style={printColor}>
          <th style={{ ...printColor, width: "14%" }}>{head}</th>
          {groups.map((g) => (
            <th key={g.key} style={printColor}>
              {g.key}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="font-semibold">만점</td>
          {groups.map((g) => (
            <td key={g.key}>{g.full}</td>
          ))}
        </tr>
        <tr>
          <td className="font-semibold">평균</td>
          {groups.map((g) => (
            <td key={g.key} style={{ color: "#2563eb", ...printColor }}>
              {g.avg.toFixed(1)}
            </td>
          ))}
        </tr>
        <tr>
          <td className="font-semibold" style={{ color: "#dc2626", ...printColor }}>
            학생점수
          </td>
          {groups.map((g) => (
            <td key={g.key} style={{ color: "#dc2626", fontWeight: 700, ...printColor }}>
              {g.score.toFixed(1)}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/** 인쇄 안정성을 위해 고정 크기 차트를 쓴다(ResponsiveContainer는 인쇄 시 크기를 다시 못 잼). */
function ChartBox({ data }: { data: { key: string; 평균: number; 학생점수: number }[] }) {
  if (data.length < 3) return null;
  return (
    <div className="mt-2 flex justify-center border border-slate-300" style={printColor}>
      <RadarChart width={560} height={300} data={data} outerRadius="72%">
        <PolarGrid stroke="#cbd5e1" />
        <PolarAngleAxis dataKey="key" tick={{ fontSize: 11, fill: "#0f172a" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} />
        <Radar name="평균" dataKey="평균" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
        <Radar name="학생점수" dataKey="학생점수" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </RadarChart>
    </div>
  );
}
