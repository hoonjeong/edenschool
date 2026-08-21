"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Upload, ScanText, SlidersHorizontal, Sparkles,
  Check, Loader2, ImageIcon, Save, Info, X, Plus, AlertTriangle, PencilLine, Eraser,
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Card, Button, Badge } from "@/components/reading/ui";
import { inputCls, labelCls } from "@/components/reading/Modal";
import { GRADE_INTENSITY, GENRES, TONES, METRICS } from "@/lib/reading/correction-config";
import { CLAUDE_MODEL_LABEL } from "@/lib/reading/claude-label";
import { recognizeImage, runCorrection, saveCorrection } from "../actions";

const STEPS = [
  { icon: Upload, label: "업로드" },
  { icon: ScanText, label: "인식 확인·수정" },
  { icon: SlidersHorizontal, label: "옵션 설정" },
  { icon: Sparkles, label: "첨삭 결과" },
];

// 인식 신뢰도가 낮은 낱말 마커 [[ ]]
const MARKER_RE = /\[\[(.*?)\]\]/g;
const stripMarkers = (t: string) => t.replace(/\[\[|\]\]/g, "");
const countMarkers = (t: string) => (t.match(MARKER_RE) ?? []).length;

const msgOf = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

export default function WizardClient({ students, edenPhilosophy, defaults }: any) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();

  // 데이터
  const [studentId, setStudentId] = useState<number | null>(null);
  const [imgUrls, setImgUrls] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [problem, setProblem] = useState("");
  const [answer, setAnswer] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [source, setSource] = useState<"ai" | "manual">("ai");
  const [ocrError, setOcrError] = useState<string | null>(null);
  // 오류 성격(재시도 가능 / 관리자 조치 필요)에 따라 안내 문구를 다르게 보여 준다.
  const [ocrHelp, setOcrHelp] = useState<{ retryable: boolean; needsAdmin: boolean } | null>(null);

  // 옵션
  const [gradeLevel, setGradeLevel] = useState(defaults.gradeLevel);
  const [genre, setGenre] = useState(defaults.genre);
  const [tone, setTone] = useState(defaults.tone);
  const [metrics, setMetrics] = useState<string[]>(defaults.metrics);
  const [custom, setCustom] = useState("");

  // 결과
  const [result, setResult] = useState<{ resultText: string; summary: string; scores: Record<string, number> } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runHelp, setRunHelp] = useState<{ retryable: boolean; needsAdmin: boolean } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selStudent = students.find((s: any) => s.id === studentId);

  const MAX_IMAGES = 20;

  // 사람이 확인·수정을 마쳐야만 첨삭으로 넘어갈 수 있다.
  const answerReady = stripMarkers(answer).trim().length > 0;
  const pendingMarkers = countMarkers(problem) + countMarkers(answer);
  const canProceed = confirmed && answerReady;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // 같은 파일 다시 선택 가능하도록 초기화
    if (files.length === 0) return;
    setProcessing(true);
    setOcrError(null);
    setOcrHelp(null);
    try {
      const urls: string[] = [];
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        try {
          urls.push(await compressImage(f));
        } catch (err) {
          console.error("이미지 처리 실패:", f.name, err);
        }
      }
      if (urls.length) setImgUrls((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
    } finally {
      setProcessing(false);
    }
  }

  function removeImg(i: number) {
    setImgUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  // AI 인식. 실패하면 실패라고 알리고 STEP 0에 머문다(예시 답안으로 대체하지 않음).
  function recognize() {
    setOcrError(null);
    setOcrHelp(null);
    start(async () => {
      try {
        const r = await recognizeImage(imgUrls);
        if (!r.ok) {
          setOcrError(r.error);
          setOcrHelp({ retryable: r.retryable !== false, needsAdmin: !!r.needsAdmin });
          return;
        }
        setProblem(r.problem);
        setAnswer(r.answer);
        setSource("ai");
        setConfirmed(false);
        setStep(1);
      } catch (e) {
        setOcrError(msgOf(e, "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."));
        setOcrHelp({ retryable: true, needsAdmin: false });
      }
    });
  }

  // AI 없이 선생님이 직접 옮겨 적는 경로
  function manualEntry() {
    setOcrError(null);
    setOcrHelp(null);
    setProblem("");
    setAnswer("");
    setSource("manual");
    setConfirmed(false);
    setStep(1);
  }

  function clearMarkers() {
    setProblem((p) => stripMarkers(p));
    setAnswer((a) => stripMarkers(a));
  }

  function run() {
    if (!canProceed) return;
    setRunError(null);
    setRunHelp(null);
    setResult(null);
    setStep(3);
    start(async () => {
      try {
        const out = await runCorrection({
          answerText: stripMarkers(answer),
          problemText: stripMarkers(problem),
          gradeLevel, genre, tone, metrics, custom,
        });
        if (!out.ok) {
          setRunError(out.error);
          setRunHelp({ retryable: out.retryable !== false, needsAdmin: !!out.needsAdmin });
          return;
        }
        setResult({ resultText: out.resultText, summary: out.summary, scores: out.scores });
      } catch (e) {
        setRunError(msgOf(e, "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."));
        setRunHelp({ retryable: true, needsAdmin: false });
      }
    });
  }

  function save() {
    if (!result) return;
    setSaveError(null);
    start(async () => {
      try {
        const r = await saveCorrection({
          studentId,
          title: `${GENRES.find((g) => g.key === genre)?.label ?? "첨삭"}${selStudent ? ` · ${selStudent.name}` : ""}`,
          genre: GENRES.find((g) => g.key === genre)?.label ?? genre,
          gradeLevel,
          tone,
          metrics,
          custom,
          problemText: stripMarkers(problem),
          answerText: stripMarkers(answer),
          resultText: result.resultText,
          summary: result.summary,
          scores: result.scores,
          images: imgUrls,
        });
        if (r.imageWarning) {
          // 저장 자체는 성공. 원본 보관만 실패한 경우 알려 준다.
          alert(r.imageWarning);
        }
        router.push(`/reading/corrections/${r.id}`);
        router.refresh();
      } catch (e) {
        setSaveError(msgOf(e, "저장에 실패했습니다. 잠시 후 다시 시도해 주세요."));
      }
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
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFile} className="hidden" />
              {imgUrls.length === 0 ? (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-line hover:border-brand-400 hover:bg-brand-50/50 grid place-items-center transition overflow-hidden">
                  <div className="text-center text-faint">
                    <ImageIcon className="size-10 mx-auto mb-2" />
                    <div className="text-sm font-semibold">클릭하여 답안 이미지 업로드</div>
                    <div className="text-[12px] mt-1">JPG, PNG · 여러 장 선택 가능 · 최대 {MAX_IMAGES}장</div>
                  </div>
                </button>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {imgUrls.map((u, i) => (
                      <div key={i} className="relative aspect-square rounded-xl border border-line overflow-hidden bg-canvas">
                        <img src={u} alt={`답안 ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 rounded bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5">
                          {i + 1}
                        </span>
                        <button onClick={() => removeImg(i)} type="button"
                          className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-black/55 text-white hover:bg-red-500 transition"
                          aria-label={`${i + 1}번째 이미지 삭제`}>
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {imgUrls.length < MAX_IMAGES && (
                      <button onClick={() => fileRef.current?.click()} type="button"
                        className="aspect-square rounded-xl border-2 border-dashed border-line hover:border-brand-400 hover:bg-brand-50/50 grid place-items-center text-faint transition">
                        <div className="text-center">
                          <Plus className="size-6 mx-auto" />
                          <div className="text-[11px] mt-0.5 font-semibold">추가</div>
                        </div>
                      </button>
                    )}
                  </div>
                  <p className="text-[12px] text-faint mt-2">
                    총 {imgUrls.length}장 · 촬영/스캔 순서대로 이어진 하나의 답안으로 인식됩니다.
                  </p>
                </div>
              )}
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
                손글씨 인식은 완벽하지 않습니다. 다음 단계에서 <b>인식 결과를 직접 확인·수정</b>한 뒤에야 첨삭을 실행할 수 있습니다.
              </div>
            </div>
          </div>

          {/* 인식 실패 안내 — 예시 답안으로 대체하지 않는다 */}
          {ocrError && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[13px] px-4 py-3 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <div>
                  <b>인식에 실패했습니다.</b>
                  <div className="mt-1">{ocrError}</div>
                  <div className="mt-1.5 text-rose-600/80">
                    {ocrHelp?.needsAdmin ? (
                      <>
                        서비스 설정·결제 문제라 같은 이미지로 다시 눌러도 같은 오류가 납니다. 조치가 끝난 뒤 다시 인식하거나,
                        지금은 아래 <b>직접 입력</b>으로 답안을 옮겨 적어 진행해 주세요.
                      </>
                    ) : (
                      <>같은 이미지로 다시 시도하거나, 아래 <b>직접 입력</b>으로 답안을 옮겨 적어 진행할 수 있습니다.</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 mt-6">
            {processing && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                <Loader2 className="size-4 animate-spin" /> 이미지 준비 중…
              </span>
            )}
            <Button variant="secondary" onClick={manualEntry} disabled={pending || processing}>
              <PencilLine className="size-4" /> 직접 입력
            </Button>
            <Button onClick={recognize} disabled={pending || processing || imgUrls.length === 0}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <ScanText className="size-4" />}
              {ocrError ? "다시 인식" : "문제·답안 자동 인식"}
            </Button>
          </div>
          {imgUrls.length === 0 && (
            <p className="text-[12px] text-faint text-right mt-2">
              자동 인식을 하려면 답안 이미지를 먼저 올려 주세요.
            </p>
          )}
        </Card>
      )}

      {/* STEP 1: 인식 확인·수정 (사람이 반드시 거치는 단계) */}
      {step === 1 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-1">② 인식 결과 확인·수정</h3>
          <p className="text-[13px] text-muted mb-5">
            {source === "ai" ? (
              <>
                아래 상자의 글을 <b>원본과 대조해 직접 고쳐 주세요.</b> AI가 옮겨 적은 초안이므로 틀린 글자가 있을 수 있습니다.
                {" "}<span className="bg-amber-200/70 px-1 rounded">노란색</span>은 인식 신뢰도가 낮은 낱말입니다.
              </>
            ) : (
              <>문제와 학생 답안을 직접 옮겨 적어 주세요. 답안은 학생이 쓴 그대로(맞춤법 포함) 입력합니다.</>
            )}
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <div className="text-[13px] font-semibold mb-1.5">
                원본 이미지{imgUrls.length > 1 && <span className="text-faint font-normal"> · {imgUrls.length}장</span>}
              </div>
              {imgUrls.length === 0 ? (
                <div className="aspect-[4/3] rounded-xl border border-line bg-canvas grid place-items-center">
                  <span className="text-faint text-sm">업로드한 이미지 없음 (직접 입력)</span>
                </div>
              ) : imgUrls.length === 1 ? (
                <div className="aspect-[4/3] rounded-xl border border-line bg-canvas grid place-items-center overflow-hidden">
                  <img src={imgUrls[0]} className="w-full h-full object-contain" alt="원본 답안" />
                </div>
              ) : (
                <div className="rounded-xl border border-line bg-canvas p-2 max-h-[520px] overflow-y-auto space-y-2">
                  {imgUrls.map((u, i) => (
                    <div key={i} className="relative">
                      <img src={u} className="w-full rounded-lg object-contain" alt={`원본 답안 ${i + 1}`} />
                      <span className="absolute top-1.5 left-1.5 rounded bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>문제 {source === "ai" && <span className="font-normal text-faint">(AI 인식 초안 — 수정 가능)</span>}</label>
                {source === "ai" && problem && <HighlightPreview text={problem} />}
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={3}
                  placeholder="예) 책을 읽고 가장 기억에 남는 장면과 그 까닭을 써 봅시다."
                  className={inputCls + " h-auto py-2 mt-1.5 resize-y leading-relaxed"}
                />
              </div>

              <div>
                <label className={labelCls}>
                  학생 답안 {source === "ai" && <span className="font-normal text-faint">(AI 인식 초안 — 수정 가능)</span>}
                  <span className="text-rose-500"> *</span>
                </label>
                {source === "ai" && answer && <HighlightPreview text={answer} />}
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={9}
                  placeholder="학생이 쓴 답안을 그대로 입력하세요."
                  className={inputCls + " h-auto py-2 mt-1.5 resize-y leading-relaxed"}
                />
                {!answerReady && (
                  <p className="text-[12px] text-rose-500 mt-1.5">
                    학생 답안이 비어 있으면 첨삭을 진행할 수 없습니다.
                  </p>
                )}
              </div>

              {pendingMarkers > 0 && (
                <div className="rounded-xl bg-amber-50 text-amber-700 text-[13px] px-4 py-3 leading-relaxed">
                  <AlertTriangle className="inline size-4 mr-1 -mt-0.5" />
                  신뢰도가 낮아 <b>[[ ]]</b>로 표시된 낱말이 <b>{pendingMarkers}곳</b> 남아 있습니다.
                  원본과 대조해 고친 뒤 대괄호를 지워 주세요.
                  <button
                    type="button"
                    onClick={clearMarkers}
                    className="ml-2 inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-0.5 text-[12px] font-semibold hover:bg-amber-100"
                  >
                    <Eraser className="size-3" /> 표시만 일괄 삭제
                  </button>
                </div>
              )}

              <label className="flex items-start gap-2 text-[13px] font-medium cursor-pointer rounded-xl border border-line px-4 py-3">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                  className="size-4 accent-brand-600 mt-0.5" />
                <span>
                  위 문제·답안을 원본과 대조해 확인했으며, 이 내용으로 첨삭을 진행합니다.
                  <span className="block text-[12px] font-normal text-faint mt-0.5">
                    체크해야 다음 단계로 넘어갈 수 있습니다.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(0)}><ArrowLeft className="size-4" /> 이전</Button>
            <Button onClick={() => setStep(2)} disabled={!canProceed}>
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

          <div className="flex items-center justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}><ArrowLeft className="size-4" /> 이전</Button>
            <div className="flex items-center gap-2">
              {!canProceed && (
                <span className="text-[12px] text-rose-500">인식 결과 확인 단계를 먼저 완료해 주세요.</span>
              )}
              <Button onClick={run} disabled={pending || metrics.length === 0 || !canProceed}>
                <Sparkles className="size-4" /> 첨삭 실행
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: 결과 */}
      {step === 3 && (
        <div className="space-y-5">
          {runError ? (
            <Card className="p-10 text-center">
              <AlertTriangle className="size-10 mx-auto text-rose-500 mb-4" />
              <div className="font-bold text-lg">첨삭에 실패했습니다</div>
              <p className="text-[13px] text-muted mt-2 max-w-lg mx-auto leading-relaxed">{runError}</p>
              {runHelp?.needsAdmin && (
                <p className="text-[12px] text-faint mt-2 max-w-lg mx-auto leading-relaxed">
                  서비스 설정·결제 문제입니다. 조치 전에는 다시 시도해도 같은 오류가 납니다.
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <ArrowLeft className="size-4" /> 옵션으로 돌아가기
                </Button>
                <Button onClick={run} disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} 다시 시도
                </Button>
              </div>
            </Card>
          ) : !result ? (
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
                    <Badge tone="brand">{CLAUDE_MODEL_LABEL}</Badge>
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

              {saveError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[13px] px-4 py-3">
                  <AlertTriangle className="inline size-4 mr-1 -mt-0.5" /> {saveError}
                </div>
              )}

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

// 업로드 이미지를 클라이언트에서 리사이즈·압축(최대 1600px, JPEG)해 data URL로 변환.
// 서버 액션 payload를 장당 수백 KB로 줄여 본문 한도 초과와 전송 지연을 방지한다.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<string> {
  let src: CanvasImageSource | null = null;
  let w = 0;
  let h = 0;
  let cleanup: (() => void) | undefined;

  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      src = bmp;
      w = bmp.width;
      h = bmp.height;
      cleanup = () => bmp.close();
    } catch {
      src = null;
    }
  }

  if (!src) {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("이미지를 불러올 수 없습니다."));
      im.src = url;
    });
    src = img;
    w = img.naturalWidth;
    h = img.naturalHeight;
    cleanup = () => URL.revokeObjectURL(url);
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("캔버스를 생성할 수 없습니다.");
    ctx.drawImage(src, 0, 0, cw, ch);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    cleanup?.();
  }
}

// [[낮은신뢰도]] 하이라이트 미리보기 — textarea와 같은 상태를 그리므로 수정하면 즉시 반영된다.
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
