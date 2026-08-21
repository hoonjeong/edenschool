"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, Search, FileBarChart, Save, Trash2, X, AlertTriangle } from "lucide-react";
import { Card, PageIntro, Badge, Button, EmptyState } from "@/components/reading/ui";
import { inputCls, labelCls } from "@/components/reading/Modal";
import { EXAM_TYPES, EXAM_TYPE_LABEL, examTitle, ITEM_COUNT, totalPossible, type ExamItemLike } from "@/lib/reading/exam";
import { toYmd } from "@/lib/reading/utils";
import { saveExamResult, deleteExamResult } from "./actions";

interface ExamOpt {
  id: number;
  type: string;
  round: number;
}
interface StudentOpt {
  id: number;
  name: string;
  grade: string;
  className: string | null;
}
interface ResultRow {
  id: number;
  studentId: number;
  studentName: string;
  grade: string;
  className: string | null;
  takenAt: string;
  totalScore: number;
  comment: string | null;
  answers: (number | null)[];
}

export default function ResultsClient({
  dbReady = true,
  exams,
  selectedExamId,
  items,
  students,
  results,
  presetStudentId,
}: {
  dbReady?: boolean;
  exams: ExamOpt[];
  selectedExamId: number | null;
  items: ExamItemLike[];
  students: StudentOpt[];
  results: ResultRow[];
  presetStudentId: number | null;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const selected = exams.find((e) => e.id === selectedExamId) ?? null;
  const types = useMemo(() => [...new Set(exams.map((e) => e.type))], [exams]);
  const roundsOfType = useMemo(
    () => exams.filter((e) => e.type === selected?.type).sort((a, b) => b.round - a.round),
    [exams, selected],
  );

  // ── 입력 폼 ────────────────────────────────────────
  const [studentId, setStudentId] = useState<number | null>(presetStudentId);
  const [q, setQ] = useState("");
  const [takenAt, setTakenAt] = useState(() => toYmd(new Date()));
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(ITEM_COUNT).fill(null));
  const [comment, setComment] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  // 시험지를 바꾸면 입력 중이던 답안을 비운다.
  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId]);

  function resetForm() {
    setStudentId(null);
    setAnswers(Array(ITEM_COUNT).fill(null));
    setComment("");
    setTakenAt(toYmd(new Date()));
    setErr("");
    setOkMsg("");
  }

  function loadResult(r: ResultRow) {
    setStudentId(r.studentId);
    setAnswers([...r.answers]);
    setComment(r.comment ?? "");
    setTakenAt(r.takenAt);
    setErr("");
    setOkMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setAnswer(idx: number, raw: string) {
    const v = raw.replace(/[^1-5]/g, "").slice(-1);
    setAnswers((prev) => prev.map((a, i) => (i === idx ? (v ? Number(v) : null) : a)));
    if (v && idx < ITEM_COUNT - 1) boxes.current[idx + 1]?.focus();
  }

  function onKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !answers[idx] && idx > 0) boxes.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < ITEM_COUNT - 1) boxes.current[idx + 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) boxes.current[idx - 1]?.focus();
  }

  const full = totalPossible(items);
  const score = useMemo(
    () =>
      items.reduce((s, it) => {
        const a = answers[it.no - 1];
        return a != null && a === it.answer ? s + it.score : s;
      }, 0),
    [items, answers],
  );
  const entered = answers.filter((a) => a != null).length;
  const existing = results.find((r) => r.studentId === studentId) ?? null;

  const filteredStudents = useMemo(
    () => (q ? students.filter((s) => s.name.includes(q)) : students),
    [students, q],
  );
  const student = students.find((s) => s.id === studentId) ?? null;

  function save() {
    setErr("");
    setOkMsg("");
    if (!selectedExamId) return setErr("시험을 선택하세요.");
    if (!studentId) return setErr("학생을 선택하세요.");
    if (entered === 0) return setErr("학생이 기재한 답을 입력하세요.");
    start(async () => {
      const res = await saveExamResult({
        examId: selectedExamId,
        studentId,
        takenAt,
        answers,
        comment,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOkMsg(`저장했습니다. ${student?.name ?? ""} ${res.totalScore}점`);
      resetForm();
      router.refresh();
    });
  }

  function del(r: ResultRow) {
    if (!confirm(`${r.studentName} 학생의 응시 결과를 삭제할까요?`)) return;
    start(async () => {
      await deleteExamResult(r.id);
      router.refresh();
    });
  }

  if (!dbReady) {
    return (
      <div>
        <PageIntro title="시험 결과 입력" desc="학생이 기재한 답을 입력하면 자동으로 채점됩니다." />
        <DbNotice />
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div>
        <PageIntro title="시험 결과 입력" desc="학생이 기재한 답을 입력하면 자동으로 채점됩니다." />
        <Card>
          <EmptyState
            icon={<ClipboardCheck className="size-6" />}
            title="문항 정보가 입력된 시험지가 없습니다"
            desc="먼저 입학 테스트 시험지에서 시험을 만들고 30문항을 저장하세요."
            action={
              <Link href="/reading/exams">
                <Button>시험지 관리로 이동</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageIntro
        title="시험 결과 입력"
        desc="시험 종류와 회차를 고르고 학생이 기재한 답을 입력하면 자동으로 채점됩니다."
      />

      {/* 시험 선택 */}
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className={labelCls}>시험지 종류</label>
            <div className="flex gap-2">
              {EXAM_TYPES.filter((t) => types.includes(t.code)).map((t) => {
                const first = exams.filter((e) => e.type === t.code).sort((a, b) => b.round - a.round)[0];
                const active = selected?.type === t.code;
                return (
                  <button
                    key={t.code}
                    onClick={() => first && router.push(`/reading/exam-results?examId=${first.id}`)}
                    className={`h-10 rounded-lg border px-4 text-sm font-semibold transition ${
                      active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-muted hover:bg-canvas"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={labelCls}>회차</label>
            <select
              value={selectedExamId ?? ""}
              onChange={(e) => router.push(`/reading/exam-results?examId=${e.target.value}`)}
              className={inputCls + " w-auto min-w-[120px]"}
            >
              {roundsOfType.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.round}회차
                </option>
              ))}
            </select>
          </div>
          <div className="text-[13px] text-muted pb-2.5">
            총점 <b className="text-ink">{full}점</b> · 문항 {items.length}개 · 응시 {results.length}명
          </div>
          {selected && (
            <Link href={`/reading/exams/${selected.id}`} className="ml-auto pb-2.5 text-[13px] text-brand-600 hover:underline">
              이 시험지의 문항 정보 보기
            </Link>
          )}
        </div>
      </Card>

      <div className="grid xl:grid-cols-3 gap-4">
        {/* 답안 입력 */}
        <Card className="p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <h3 className="font-bold text-[15px]">
              {selected ? examTitle(selected.type, selected.round) : "시험"} 답안 입력
            </h3>
            {student && (
              <Badge tone="brand">
                {student.name} {student.grade}
              </Badge>
            )}
            {existing && <Badge tone="amber">이미 입력됨 · 저장하면 덮어씁니다</Badge>}
            <div className="ml-auto flex items-center gap-2 text-[13px]">
              <span className="text-faint">입력 {entered}/{ITEM_COUNT}</span>
              <span className="rounded-lg bg-canvas px-3 py-1 font-bold tabular-nums">
                {score} <span className="text-faint font-normal">/ {full}점</span>
              </span>
            </div>
          </div>

          {/* 학생 · 응시일 */}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelCls}>학생</label>
              {student ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
                    {student.name} {student.grade}
                    {student.className ? ` · ${student.className}` : ""}
                  </span>
                  <button onClick={() => setStudentId(null)} className="text-[13px] text-faint hover:text-ink">
                    변경
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="이름 검색"
                      className={inputCls + " pl-9"}
                    />
                  </div>
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-line divide-y divide-line/60">
                    {filteredStudents.length === 0 ? (
                      <p className="px-3 py-3 text-[13px] text-faint">해당하는 학생이 없습니다.</p>
                    ) : (
                      filteredStudents.slice(0, 50).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStudentId(s.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                        >
                          {s.name} <span className="text-[12px] text-faint">{s.grade}</span>
                          {s.className && <span className="text-[12px] text-faint"> · {s.className}</span>}
                          {results.some((r) => r.studentId === s.id) && (
                            <span className="ml-1 text-[11px] text-amber-600">· 입력됨</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            <div>
              <label className={labelCls}>응시일</label>
              <input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* 30문항 답안 */}
          <label className={labelCls}>학생이 기재한 답 (1~5, 무응답은 비워 둠)</label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: ITEM_COUNT }, (_, i) => {
              const item = items.find((it) => it.no === i + 1);
              const given = answers[i];
              const correct = item && given != null ? given === item.answer : null;
              return (
                <div key={i} className="text-center">
                  <div className="text-[11px] text-faint">{i + 1}</div>
                  <input
                    ref={(el) => {
                      boxes.current[i] = el;
                    }}
                    value={given ?? ""}
                    onChange={(e) => setAnswer(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onFocus={(e) => e.currentTarget.select()}
                    inputMode="numeric"
                    className={`h-10 w-full rounded-lg border text-center text-sm font-bold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
                      correct === null
                        ? "border-line bg-surface"
                        : correct
                          ? "border-mint-500/40 bg-mint-50 text-mint-600"
                          : "border-rose-500/40 bg-rose-50 text-rose-600"
                    }`}
                  />
                  <div className="h-4 text-[11px] font-bold">
                    {correct === null ? "" : correct ? <span className="text-mint-600">O</span> : <span className="text-rose-500">X</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <label className={labelCls}>종합의견 (선택)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className={inputCls + " h-auto resize-none py-2"}
              placeholder="분석표 하단에 인쇄됩니다."
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {err && <span className="text-[13px] font-semibold text-rose-500">{err}</span>}
            {okMsg && <span className="text-[13px] font-semibold text-mint-600">{okMsg}</span>}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={resetForm} disabled={busy}>
                <X className="size-4" /> 초기화
              </Button>
              <Button onClick={save} disabled={busy}>
                <Save className="size-4" /> {existing ? "덮어쓰기 저장" : "저장하고 채점"}
              </Button>
            </div>
          </div>
        </Card>

        {/* 응시 결과 목록 */}
        <Card className="p-5">
          <h3 className="font-bold text-[15px] mb-3">
            응시 결과 <span className="font-normal text-faint text-[13px]">({results.length}명)</span>
          </h3>
          {results.length === 0 ? (
            <p className="text-[13px] text-faint">아직 입력된 결과가 없습니다.</p>
          ) : (
            <div className="space-y-1.5 max-h-[560px] overflow-y-auto">
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                  <button
                    onClick={() => loadResult(r)}
                    title="이 결과를 불러와 수정"
                    className="min-w-0 flex-1 text-left hover:text-brand-700"
                  >
                    <div className="font-semibold text-sm truncate">
                      {r.studentName} <span className="text-[12px] font-normal text-faint">{r.grade}</span>
                    </div>
                    <div className="text-[11px] text-faint tabular-nums">{r.takenAt}</div>
                  </button>
                  <div className="text-right">
                    <div className="font-extrabold tabular-nums text-brand-600">{r.totalScore}</div>
                    <div className="text-[11px] text-faint">/ {full}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/reading/exam-results/${r.id}`}
                      title="분석표 보기 · 인쇄"
                      className="grid size-7 place-items-center rounded-md text-faint hover:bg-canvas hover:text-brand-600"
                    >
                      <FileBarChart className="size-4" />
                    </Link>
                    <button
                      onClick={() => del(r)}
                      title="삭제"
                      disabled={busy}
                      className="grid size-7 place-items-center rounded-md text-faint hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[12px] text-faint">
            {EXAM_TYPE_LABEL[selected?.type ?? ""] ?? ""} {selected?.round}회차 기준입니다. 이름을 눌러 불러오면 답안을 수정할 수 있습니다.
          </p>
        </Card>
      </div>
    </div>
  );
}

function DbNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="font-bold text-[15px] text-amber-700 inline-flex items-center gap-1.5">
        <AlertTriangle className="size-4" /> 시험 테이블이 아직 없습니다
      </h3>
      <p className="mt-1.5 text-[13px] text-amber-700/90">
        edenbooks DB에 <b>edenschool-app/sql/edenbooks-exam.sql</b> 을 1회 실행하면 입학 테스트 기능이 켜집니다.
        (기존 데이터에 영향 없는 신규 테이블 3개: Exam · ExamItem · ExamResult)
      </p>
    </div>
  );
}
