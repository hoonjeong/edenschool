"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Upload, ScanText, SlidersHorizontal, Sparkles,
  Check, Loader2, ImageIcon, Save, Info,
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Card, Button, Badge } from "@/components/reading/ui";
import { inputCls, labelCls } from "@/components/reading/Modal";
import { GRADE_INTENSITY, GENRES, TONES, METRICS } from "@/lib/reading/correction-config";
import { recognizeImage, runCorrection, saveCorrection } from "../actions";

const STEPS = [
  { icon: Upload, label: "업로드" },
  { icon: ScanText, label: "인식 확인" },
  { icon: SlidersHorizontal, label: "옵션 설정" },
  { icon: Sparkles, label: "첨삭 결과" },
];

export default function WizardClient({ students, edenPhilosophy, defaults }: any) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();

  // 데이터
  const [studentId, setStudentId] = useState<number | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [answer, setAnswer] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // 옵션
  const [gradeLevel, setGradeLevel] = useState(defaults.gradeLevel);
  const [genre, setGenre] = useState(defaults.genre);
  const [tone, setTone] = useState(defaults.tone);
  const [metrics, setMetrics] = useState<string[]>(defaults.metrics);
  const [custom, setCustom] = useState("");

  // 결과
  const [result, setResult] = useState<{ resultText: string; summary: string; scores: Record<string, number>; ai?: boolean } | null>(null);

  const selStudent = students.find((s: any) => s.id === studentId);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImgUrl(reader.result as string);
    reader.readAsDataURL(f);
  }

  function recognize() {
    start(async () => {
      const r = await recognizeImage(imgUrl ?? undefined);
      setProblem(r.problem);
      setAnswer(r.answer);
      setStep(1);
    });
  }

  function run() {
    setStep(3);
    start(async () => {
      const out = await runCorrection({
        answerText: answer.replace(/\[\[|\]\]/g, ""),
        problemText: problem.replace(/\[\[|\]\]/g, ""),
        gradeLevel, genre, tone, metrics, custom,
      });
      setResult(out);
    });
  }

  function save() {
    if (!result) return;
    start(async () => {
      const grd = students.find((s: any) => s.id === studentId)?.grade ?? gradeLevel;
      const r = await saveCorrection({
        studentId,
        title: `${GENRES.find((g) => g.key === genre)?.label ?? "첨삭"}${selStudent ? ` · ${selStudent.name}` : ""}`,
        genre: GENRES.find((g) => g.key === genre)?.label ?? genre,
        gradeLevel,
        tone,
        metrics,
        custom,
        problemText: problem.replace(/\[\[|\]\]/g, ""),
        answerText: answer.replace(/\[\[|\]\]/g, ""),
        resultText: result.resultText,
        summary: result.summary,
        scores: result.scores,
      });
      router.push(`/reading/corrections/${r.id}`);
      router.refresh();
    });
  }

  const gradeInfo = GRADE_INTENSITY.find((g) => g.grade === gradeLevel);

  return (
    <div className="pb-8">
      <Link href="/reading/corrections" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4">
        <ArrowLeft className="size-4" /> 첨삭 목록
      </Link>

      {/* 스텝퍼 */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? "text-brand-700" : "text-faint"}`}>
              <div className={`grid size-9 place-items-center rounded-xl font-bold text-sm ${
                i < step ? "bg-brand-600 text-white" : i === step ? "bg-brand-100 text-brand-700 ring-2 ring-brand-500" : "bg-canvas text-faint"
              }`}>
                {i < step ? <Check className="size-4" /> : <s.icon className="size-4" />}
              </div>
              <span className="hidden sm:block text-[13px] font-semibold">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-brand-500" : "bg-line"}`} />}
          </div>
        ))}
      </div>

      {/* STEP 0: 업로드 */}
      {step === 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-1">① 답안지 업로드</h3>
          <p className="text-[13px] text-muted mb-5">학생 답안을 스캔하거나 촬영해 올려 주세요. (여러 장 가능)</p>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-line hover:border-brand-400 hover:bg-brand-50/50 grid place-items-center transition overflow-hidden">
                {imgUrl ? (
                  <img src={imgUrl} alt="답안 미리보기" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-faint">
                    <ImageIcon className="size-10 mx-auto mb-2" />
                    <div className="text-sm font-semibold">클릭하여 답안 이미지 업로드</div>
                    <div className="text-[12px] mt-1">JPG, PNG · 최대 20장</div>
                  </div>
                )}
              </button>
            </div>
            <div>
              <label className={labelCls}>학생 (선택)</label>
              <select className={inputCls} value={studentId ?? ""} onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">학생 미지정</option>
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
              <p className="text-[12px] text-faint mt-1.5">학생을 지정하면 첨삭 이력이 프로필에 누적됩니다.</p>

              <div className="mt-4 rounded-xl bg-amber-50 text-amber-700 text-[13px] px-4 py-3 leading-relaxed">
                <Info className="inline size-4 mr-1 -mt-0.5" />
                손글씨 인식은 완벽하지 않습니다. 다음 단계에서 <b>인식 결과를 반드시 확인·교정</b>한 뒤 첨삭이 진행됩니다.
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={recognize} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <ScanText className="size-4" />}
              문제·답안 자동 인식
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 1: 인식 확인 */}
      {step === 1 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-1">② 인식 결과 확인·교정</h3>
          <p className="text-[13px] text-muted mb-5">
            <span className="bg-amber-200/70 px-1 rounded">노란색</span>으로 표시된 부분은 인식 신뢰도가 낮습니다. 원본과 대조해 교정하세요.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <div className="text-[13px] font-semibold mb-1.5">원본 이미지</div>
              <div className="aspect-[4/3] rounded-xl border border-line bg-canvas grid place-items-center overflow-hidden">
                {imgUrl ? <img src={imgUrl} className="w-full h-full object-contain" alt="" /> : <span className="text-faint text-sm">이미지 없음 (샘플 인식)</span>}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>문제 (인식됨)</label>
                <HighlightPreview text={problem} />
                <textarea value={problem.replace(/\[\[|\]\]/g, "")} onChange={(e) => setProblem(e.target.value)}
                  rows={2} className={inputCls + " h-auto py-2 mt-1.5 resize-none"} />
              </div>
              <div>
                <label className={labelCls}>학생 답안 (인식됨)</label>
                <HighlightPreview text={answer} />
                <textarea value={answer.replace(/\[\[|\]\]/g, "")} onChange={(e) => setAnswer(e.target.value)}
                  rows={5} className={inputCls + " h-auto py-2 mt-1.5 resize-none"} />
              </div>
              <label className="flex items-center gap-2 text-[13px] font-medium cursor-pointer">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                  className="size-4 accent-brand-600" />
                인식 결과가 원본과 일치함을 확인했습니다.
              </label>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(0)}><ArrowLeft className="size-4" /> 이전</Button>
            <Button onClick={() => setStep(2)} disabled={!confirmed}>
              확정하고 옵션 설정 <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: 옵션 */}
      {step === 2 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-1">③ 첨삭 옵션 설정</h3>
          <p className="text-[13px] text-muted mb-5">학년 강도·글 종류·방향성·중점 척도를 설정합니다. 이든의 방향성은 모든 첨삭에 공통 반영됩니다.</p>

          <div className="space-y-6">
            {/* 학년별 강도 */}
            <div>
              <label className={labelCls}>학년별 첨삭 강도</label>
              <div className="flex flex-wrap gap-1.5">
                {GRADE_INTENSITY.map((g) => (
                  <button key={g.grade} onClick={() => setGradeLevel(g.grade)}
                    className={`rounded-lg px-3.5 py-2 text-sm font-bold border transition ${gradeLevel === g.grade ? "bg-brand-600 text-white border-brand-600" : "border-line text-muted hover:bg-canvas"}`}>
                    {g.grade}
                  </button>
                ))}
              </div>
              {gradeInfo && (
                <div className="mt-2 rounded-lg bg-brand-50 text-brand-700 text-[13px] px-3.5 py-2.5">
                  <b>{gradeInfo.focus}</b><br />{gradeInfo.guide}
                </div>
              )}
            </div>

            {/* 글 종류 */}
            <div>
              <label className={labelCls}>글의 종류</label>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((g) => (
                  <button key={g.key} onClick={() => setGenre(g.key)}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold border transition ${genre === g.key ? "bg-ink text-white border-ink" : "border-line text-muted hover:bg-canvas"}`}
                    title={g.lens}>
                    {g.label}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-faint mt-1.5">{GENRES.find((g) => g.key === genre)?.lens}</p>
            </div>

            {/* 방향성(톤) */}
            <div>
              <label className={labelCls}>개별화 첨삭 방향성</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TONES.map((t) => (
                  <button key={t.key} onClick={() => setTone(t.key)}
                    className={`rounded-xl border p-3 text-left transition ${tone === t.key ? "border-brand-500 bg-brand-50 ring-1 ring-brand-300" : "border-line hover:bg-canvas"}`}>
                    <div className="text-xl">{t.emoji}</div>
                    <div className="font-bold text-[13px] mt-1">{t.label}</div>
                    <div className="text-[11px] text-faint">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 중점 척도 */}
            <div>
              <label className={labelCls}>지도 강사 중점 척도 <span className="font-normal text-faint">(복수 선택)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {METRICS.map((m) => {
                  const on = metrics.includes(m.key);
                  return (
                    <button key={m.key} onClick={() => setMetrics((prev) => on ? prev.filter((x) => x !== m.key) : [...prev, m.key])}
                      className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold border transition ${on ? "bg-mint-500 text-white border-mint-500" : "border-line text-muted hover:bg-canvas"}`}
                      title={m.desc}>
                      {on && <Check className="inline size-3.5 mr-1 -mt-0.5" />}{m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 직접 지시 */}
            <div>
              <label className={labelCls}>강사 직접 지시 (선택)</label>
              <input value={custom} onChange={(e) => setCustom(e.target.value)} className={inputCls}
                placeholder='예: "결론이 약한 점 위주로", "비유 표현을 칭찬해 주세요"' />
            </div>

            {/* 이든 방향성 */}
            <div>
              <label className={labelCls}>이든 독서교육원 방향성 <Badge tone="brand" className="ml-1">모든 첨삭에 공통 반영</Badge></label>
              <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-[13px] text-brand-800 whitespace-pre-line leading-relaxed">
                {edenPhilosophy}
              </div>
              <p className="text-[12px] text-faint mt-1.5">설정 → 첨삭 기본값에서 수정할 수 있습니다.</p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}><ArrowLeft className="size-4" /> 이전</Button>
            <Button onClick={run} disabled={pending || metrics.length === 0}>
              <Sparkles className="size-4" /> 첨삭 실행
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: 결과 */}
      {step === 3 && (
        <div className="space-y-5">
          {!result ? (
            <Card className="p-16 text-center">
              <Loader2 className="size-10 mx-auto animate-spin text-brand-500 mb-4" />
              <div className="font-bold text-lg">AI가 첨삭 중입니다…</div>
              <p className="text-[13px] text-muted mt-1">이든의 방향성과 선택한 옵션을 반영해 분석지를 작성하고 있어요.</p>
            </Card>
          ) : (
            <>
              <div className="grid lg:grid-cols-3 gap-5">
                <Card className="p-5 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-[15px]">이든 서술형 분석지</h3>
                    <Badge tone="mint">첨삭 완료</Badge>
                    <Badge tone={result.ai ? "brand" : "slate"}>
                      {result.ai ? "Claude Opus 4.8" : "샘플(오프라인)"}
                    </Badge>
                    <span className="ml-auto text-[12px] text-faint">아래 내용은 자유롭게 편집할 수 있습니다.</span>
                  </div>
                  <textarea value={result.resultText} onChange={(e) => setResult({ ...result, resultText: e.target.value })}
                    rows={16} className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-[13.5px] leading-relaxed outline-none focus:border-brand-500 resize-none font-mono" />
                </Card>
                <Card className="p-5">
                  <h3 className="font-bold text-[15px] mb-2">척도별 점수</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={METRICS.map((m) => ({ metric: m.label, score: result.scores[m.key] ?? 0 }))} outerRadius="72%">
                        <PolarGrid stroke="#e6e8ec" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#64748b" }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {METRICS.map((m) => (
                      <div key={m.key} className="flex items-center gap-2 text-[12px]">
                        <span className="w-16 text-muted">{m.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-canvas overflow-hidden">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${result.scores[m.key] ?? 0}%` }} />
                        </div>
                        <span className="w-8 text-right font-semibold tabular-nums">{result.scores[m.key]}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}><ArrowLeft className="size-4" /> 옵션 수정</Button>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-faint">⚠ 선생님 검토 후 학생·학부모에게 전달하세요.</span>
                  <Button onClick={save} disabled={pending}>
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} 저장
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// [[낮은신뢰도]] 하이라이트 미리보기
function HighlightPreview({ text }: { text: string }) {
  const parts = text.split(/(\[\[.*?\]\])/g);
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] leading-relaxed">
      {parts.map((p, i) =>
        p.startsWith("[[") ? (
          <mark key={i} className="bg-amber-200/70 rounded px-0.5">{p.replace(/\[\[|\]\]/g, "")}</mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </div>
  );
}
