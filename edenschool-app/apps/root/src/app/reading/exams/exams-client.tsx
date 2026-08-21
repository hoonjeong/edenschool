"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Pencil, ClipboardCheck, AlertTriangle } from "lucide-react";
import { Card, PageIntro, Badge, Button, EmptyState } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { EXAM_TYPES, EXAM_TYPE_LABEL, ITEM_COUNT } from "@/lib/reading/exam";
import { createExam, deleteExam } from "./actions";

interface ExamRow {
  id: number;
  type: string;
  round: number;
  itemCount: number;
  resultCount: number;
}

export default function ExamsClient({ exams, dbReady = true }: { exams: ExamRow[]; dbReady?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();

  function del(row: ExamRow) {
    const warn =
      row.resultCount > 0
        ? `\n\n⚠️ 이미 입력된 학생 응시 결과 ${row.resultCount}건도 함께 삭제됩니다.`
        : "";
    if (!confirm(`${EXAM_TYPE_LABEL[row.type] ?? row.type} ${row.round}회차 시험지를 삭제할까요?${warn}`)) return;
    start(async () => {
      await deleteExam(row.id);
      router.refresh();
    });
  }

  return (
    <div>
      <PageIntro
        title="입학 테스트 시험지"
        desc="시험 종류(이서·이룸·이든)와 회차별로 30문항의 정답·배점·영역을 등록합니다."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> 시험 생성
          </Button>
        }
      />

      {!dbReady ? (
        <DbNotice />
      ) : exams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="size-6" />}
            title="등록된 시험지가 없습니다"
            desc="시험 생성으로 종류와 회차를 만든 뒤 문항 정보를 입력하세요."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" /> 시험 생성
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map((e) => {
            const ready = e.itemCount >= ITEM_COUNT;
            return (
              <Card key={e.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[15px]">
                      {EXAM_TYPE_LABEL[e.type] ?? e.type} {e.round}회차
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {ready ? (
                        <Badge tone="mint">문항 {e.itemCount}개</Badge>
                      ) : (
                        <Badge tone="amber">
                          <AlertTriangle className="size-3" /> 문항 {e.itemCount}/{ITEM_COUNT}
                        </Badge>
                      )}
                      <Badge tone="slate">응시 {e.resultCount}명</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link href={`/reading/exams/${e.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      <Pencil className="size-4" /> 문항 입력
                    </Button>
                  </Link>
                  <Link href={`/reading/exam-results?examId=${e.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full" disabled={!ready}>
                      <ClipboardCheck className="size-4" /> 결과 입력
                    </Button>
                  </Link>
                  <button
                    onClick={() => del(e)}
                    disabled={busy}
                    className="h-8 shrink-0 rounded-lg px-2 text-[12px] font-semibold text-faint hover:bg-rose-50 hover:text-rose-500"
                  >
                    삭제
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && dbReady && <CreateModal exams={exams} onClose={() => setOpen(false)} />}
    </div>
  );
}

function CreateModal({ exams, onClose }: { exams: ExamRow[]; onClose: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<string>(EXAM_TYPES[0].code);
  const [busy, start] = useTransition();
  const [err, setErr] = useState("");

  // 같은 종류의 마지막 회차 + 1을 기본값으로
  const nextRound = useMemo(() => {
    const rounds = exams.filter((e) => e.type === type).map((e) => e.round);
    return rounds.length ? Math.max(...rounds) + 1 : 1;
  }, [exams, type]);
  const [round, setRound] = useState<string>("");

  const roundValue = round === "" ? String(nextRound) : round;

  function submit() {
    setErr("");
    start(async () => {
      const res = await createExam({ type, round: Number(roundValue) });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      // 생성 직후 문항 입력 화면으로
      router.push(`/reading/exams/${res.id}`);
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="시험 생성"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button onClick={submit} disabled={busy}>
            생성하기
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>시험지 종류</label>
          <div className="grid grid-cols-3 gap-2">
            {EXAM_TYPES.map((t) => (
              <button
                key={t.code}
                onClick={() => setType(t.code)}
                className={`h-10 rounded-lg border text-sm font-semibold transition ${
                  type === t.code
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line text-muted hover:bg-canvas"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>회차</label>
          <input
            type="number"
            min={1}
            className={inputCls}
            value={roundValue}
            onChange={(e) => setRound(e.target.value)}
          />
          <p className="mt-1 text-[12px] text-faint">
            생성하면 {ITEM_COUNT}문항 입력 화면으로 이동합니다. 문항 정보를 저장해야 결과 입력에 사용할 수 있습니다.
          </p>
        </div>
        {err && <p className="text-[13px] text-rose-500">{err}</p>}
      </div>
    </Modal>
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
