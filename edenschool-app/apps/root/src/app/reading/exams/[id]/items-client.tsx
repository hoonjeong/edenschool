"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardPaste, Save, Check } from "lucide-react";
import { Card, PageIntro, Badge, Button } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { AREAS, ABILITIES, ITEM_COUNT, examTitle } from "@/lib/reading/exam";
import { saveExamItems } from "../actions";

/* 표 안 입력칸. 높이·테두리색이 겹치지 않게 조건부로 한 벌만 만든다. */
const cellCls = (ok: boolean) =>
  `w-full h-9 rounded-lg border px-2 text-sm outline-none transition bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
    ok ? "border-line" : "border-rose-300"
  }`;

interface Row {
  no: number;
  answer: string;
  score: string;
  area: string;
  ability: string;
  note: string;
}

function buildRows(items: any[]): Row[] {
  return Array.from({ length: ITEM_COUNT }, (_, i) => {
    const found = items.find((it) => it.no === i + 1);
    return {
      no: i + 1,
      answer: found ? String(found.answer) : "",
      score: found ? String(found.score) : "",
      area: found?.area ?? "",
      ability: found?.ability ?? "",
      note: found?.note ?? "",
    };
  });
}

export default function ItemsClient({
  exam,
  items,
}: {
  exam: { id: number; type: string; round: number; resultCount: number };
  items: any[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => buildRows(items));
  const [paste, setPaste] = useState(false);
  const [busy, start] = useTransition();
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  const total = rows.reduce((s, r) => s + (Number(r.score) || 0), 0);
  const filled = rows.filter((r) => r.answer && r.score && r.area.trim()).length;

  function edit(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  /** 같은 열 아래쪽을 현재 값으로 채우기 (배점처럼 반복되는 값 입력용) */
  function fillDown(idx: number, key: "score" | "area" | "ability") {
    const v = rows[idx][key];
    setRows((prev) => prev.map((r, i) => (i > idx ? { ...r, [key]: v } : r)));
    setSaved(false);
  }

  function applyPaste(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return;
    const next = [...rows];
    lines.forEach((line, li) => {
      const cells = line.split("\t").map((c) => c.trim());
      // 첫 칸이 문항 번호면 [번호, 정답, 점수, 영역, 독해능력, 설명], 아니면 줄 순서대로
      const hasNo = /^\d+$/.test(cells[0] ?? "") && Number(cells[0]) >= 1 && Number(cells[0]) <= ITEM_COUNT && cells.length >= 4;
      const no = hasNo ? Number(cells[0]) : li + 1;
      const c = hasNo ? cells.slice(1) : cells;
      const idx = no - 1;
      if (idx < 0 || idx >= ITEM_COUNT) return;
      next[idx] = {
        no,
        answer: (c[0] ?? "").replace(/[^\d]/g, ""),
        score: (c[1] ?? "").replace(/[^\d.]/g, ""),
        area: c[2] ?? "",
        ability: c[3] ?? "",
        note: c[4] ?? "",
      };
    });
    setRows(next);
    setPaste(false);
    setSaved(false);
  }

  function save() {
    setErr("");
    const payload = rows.map((r) => ({
      no: r.no,
      answer: Number(r.answer),
      score: Number(r.score),
      area: r.area.trim(),
      ability: r.ability.trim() || null,
      note: r.note.trim() || null,
    }));
    const bad = payload.find(
      (p) => !Number.isInteger(p.answer) || p.answer < 1 || p.answer > 5 || !(p.score > 0) || !p.area,
    );
    if (bad) {
      setErr(`${bad.no}번 문항을 확인하세요. 정답(1~5) · 점수 · 영역은 필수입니다.`);
      return;
    }
    start(async () => {
      const res = await saveExamItems(exam.id, payload);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div>
      <PageIntro
        title={`${examTitle(exam.type, exam.round)} · 문항 정보`}
        desc={`${ITEM_COUNT}문항의 정답 · 점수 · 영역은 필수, 독해능력 · 문항 설명은 비워 둘 수 있습니다.`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/reading/exams">
              <Button variant="ghost">
                <ArrowLeft className="size-4" /> 목록
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setPaste(true)}>
              <ClipboardPaste className="size-4" /> 엑셀에서 붙여넣기
            </Button>
            <Button onClick={save} disabled={busy}>
              {saved ? <Check className="size-4" /> : <Save className="size-4" />}
              {saved ? "저장됨" : "저장"}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={filled === ITEM_COUNT ? "mint" : "amber"}>
          필수 입력 {filled}/{ITEM_COUNT}
        </Badge>
        <Badge tone="brand">배점 합계 {total}점</Badge>
        {exam.resultCount > 0 && (
          <span className="text-[12px] text-faint">
            이미 {exam.resultCount}명의 결과가 입력되어 있습니다. 저장하면 자동으로 다시 채점됩니다.
          </span>
        )}
        {err && <span className="text-[13px] font-semibold text-rose-500">{err}</span>}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-canvas text-muted text-left">
                <th className="px-3 py-2.5 font-semibold border-b border-line w-14">번호</th>
                <th className="px-3 py-2.5 font-semibold border-b border-line w-24">정답 *</th>
                <th className="px-3 py-2.5 font-semibold border-b border-line w-28">점수 *</th>
                <th className="px-3 py-2.5 font-semibold border-b border-line w-40">영역 *</th>
                <th className="px-3 py-2.5 font-semibold border-b border-line w-44">독해능력</th>
                <th className="px-3 py-2.5 font-semibold border-b border-line">문항 설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {rows.map((r, i) => (
                <tr key={r.no} className="hover:bg-brand-50/30">
                  <td className="px-3 py-1.5 text-center font-semibold tabular-nums">{r.no}</td>
                  <td className="px-2 py-1.5">
                    <select
                      value={r.answer}
                      onChange={(e) => edit(i, { answer: e.target.value })}
                      className={cellCls(!!r.answer)}
                    >
                      <option value="">-</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={r.score}
                        onChange={(e) => edit(i, { score: e.target.value })}
                        className={cellCls(!!r.score)}
                      />
                      <FillDown onClick={() => fillDown(i, "score")} />
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <input
                        list="exam-areas"
                        value={r.area}
                        onChange={(e) => edit(i, { area: e.target.value })}
                        className={cellCls(!!r.area.trim())}
                      />
                      <FillDown onClick={() => fillDown(i, "area")} />
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      list="exam-abilities"
                      value={r.ability}
                      onChange={(e) => edit(i, { ability: e.target.value })}
                      className={cellCls(true)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      value={r.note}
                      onChange={(e) => edit(i, { note: e.target.value })}
                      className={cellCls(true)}
                      placeholder="예: 글의 중심 내용 파악"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <datalist id="exam-areas">
        {AREAS.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <datalist id="exam-abilities">
        {ABILITIES.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={busy}>
          {saved ? <Check className="size-4" /> : <Save className="size-4" />}
          {saved ? "저장됨" : "문항 정보 저장"}
        </Button>
      </div>

      {paste && <PasteModal onClose={() => setPaste(false)} onApply={applyPaste} />}
    </div>
  );
}

function FillDown({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="아래 행에 모두 채우기"
      className="shrink-0 grid size-7 place-items-center rounded-md text-[11px] font-bold text-faint hover:bg-canvas hover:text-brand-600"
    >
      ↓
    </button>
  );
}

function PasteModal({ onClose, onApply }: { onClose: () => void; onApply: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title="엑셀에서 붙여넣기"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => onApply(text)} disabled={!text.trim()}>
            표에 채우기
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] text-muted">
          엑셀에서 <b>번호 · 답 · 점수 · 영역 · 독해능력 · 문항 설명</b> 순서로 30줄을 복사해 붙여넣으세요.
          번호 열이 없으면 붙여넣은 줄 순서대로 1번부터 채웁니다. (머리글 줄은 빼고 복사)
        </p>
        <div>
          <label className={labelCls}>붙여넣기</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className={inputCls + " h-auto py-2 font-mono text-[12px]"}
            placeholder={"1\t1\t3\t듣기말하기\t추론적 독해\t발표 준비 메모에 대한 설명의 적절성 판단"}
          />
        </div>
      </div>
    </Modal>
  );
}
