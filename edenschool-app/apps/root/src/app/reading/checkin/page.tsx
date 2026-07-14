"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Delete, X, Check, CircleAlert, BookOpenText, ArrowLeft } from "lucide-react";
import { lookupByLast4, checkIn, type Match } from "./actions";

type View =
  | { kind: "input" }
  | { kind: "select"; matches: Match[] }
  | { kind: "notfound" }
  | { kind: "success"; name: string; className: string | null; late?: boolean }
  | { kind: "duplicate"; name: string };

export default function CheckinPage() {
  const [digits, setDigits] = useState("");
  const [view, setView] = useState<View>({ kind: "input" });
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setClock(
        new Intl.DateTimeFormat("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const reset = useCallback(() => {
    setDigits("");
    setView({ kind: "input" });
  }, []);

  const submit = useCallback(
    async (val: string) => {
      if (val.length !== 4 || busy) return;
      setBusy(true);
      try {
        const matches = await lookupByLast4(val);
        if (matches.length === 0) setView({ kind: "notfound" });
        else if (matches.length === 1) await record(matches[0]);
        else setView({ kind: "select", matches });
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  async function record(m: Match) {
    if (m.alreadyChecked) {
      setView({ kind: "duplicate", name: m.name });
      setTimeout(reset, 2500);
      return;
    }
    setBusy(true);
    try {
      const r = await checkIn(m.id);
      if (r.ok) {
        setView({ kind: "success", name: r.name!, className: r.className ?? null });
        setTimeout(reset, 2800);
      } else if (r.duplicate) {
        setView({ kind: "duplicate", name: r.name! });
        setTimeout(reset, 2500);
      }
    } finally {
      setBusy(false);
    }
  }

  function press(n: string) {
    if (view.kind !== "input") return;
    if (digits.length >= 4) return;
    const next = digits + n;
    setDigits(next);
    if (next.length === 4) submit(next);
  }

  // 물리 키보드 지원
  useEffect(() => {
    if (view.kind !== "input") return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setDigits((d) => d.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-canvas flex flex-col">
      {/* 상단바 */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
          <BookOpenText className="size-5" />
        </div>
        <div>
          <div className="font-extrabold">이든 국어 독서교육원</div>
          <div className="text-[13px] text-muted">등원 체크인</div>
        </div>
        <div className="ml-auto text-2xl font-bold tabular-nums text-brand-700">{clock}</div>
        <Link href="/reading" className="ml-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> 관리자
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {view.kind === "input" && (
          <div className="w-full max-w-md">
            <h1 className="text-center text-2xl font-extrabold mb-1">핸드폰 뒷자리 4자리</h1>
            <p className="text-center text-muted mb-7">를 입력해 주세요</p>

            {/* 표시 */}
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`size-16 rounded-2xl border-2 grid place-items-center text-3xl font-extrabold transition ${
                    digits[i]
                      ? "border-brand-500 bg-brand-50 text-brand-700 animate-pop"
                      : "border-line bg-surface text-faint"
                  }`}
                >
                  {digits[i] ? "●" : ""}
                </div>
              ))}
            </div>

            {/* 키패드 */}
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                <KeyBtn key={n} onClick={() => press(n)} disabled={busy}>
                  {n}
                </KeyBtn>
              ))}
              <KeyBtn onClick={() => setDigits("")} disabled={busy} variant="muted">
                <X className="size-7" />
              </KeyBtn>
              <KeyBtn onClick={() => press("0")} disabled={busy}>
                0
              </KeyBtn>
              <KeyBtn onClick={() => setDigits((d) => d.slice(0, -1))} disabled={busy} variant="muted">
                <Delete className="size-7" />
              </KeyBtn>
            </div>
          </div>
        )}

        {view.kind === "select" && (
          <div className="w-full max-w-md text-center animate-fadeUp">
            <h1 className="text-2xl font-extrabold mb-1">본인을 선택해 주세요</h1>
            <p className="text-muted mb-6">같은 뒷자리 학생이 여러 명입니다.</p>
            <div className="space-y-3">
              {view.matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => record(m)}
                  disabled={m.alreadyChecked || busy}
                  className="w-full flex items-center gap-3 rounded-2xl border-2 border-line bg-surface px-5 py-4 hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50 transition"
                >
                  <span className="text-xl font-extrabold">{m.name}</span>
                  <span className="text-muted">{m.grade}</span>
                  {m.className && <span className="text-sm text-faint">{m.className}</span>}
                  {m.alreadyChecked && (
                    <span className="ml-auto text-sm font-semibold text-mint-600">체크인 완료</span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={reset} className="mt-6 text-muted hover:text-ink">
              돌아가기
            </button>
          </div>
        )}

        {view.kind === "success" && (
          <div className="text-center animate-fadeUp">
            <div className="mx-auto grid size-28 place-items-center rounded-full bg-mint-500 text-white mb-6 shadow-lg">
              <Check className="size-16" strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-extrabold">
              <span className="text-mint-600">{view.name}</span>님 등원 완료!
            </h1>
            {view.className && <p className="text-muted mt-2 text-lg">{view.className}</p>}
            <p className="text-faint mt-4">오늘도 반가워요 👋</p>
          </div>
        )}

        {view.kind === "duplicate" && (
          <div className="text-center animate-fadeUp">
            <div className="mx-auto grid size-24 place-items-center rounded-full bg-amber-100 text-amber-500 mb-5">
              <CircleAlert className="size-14" />
            </div>
            <h1 className="text-2xl font-extrabold">{view.name}님은 이미 체크인했어요</h1>
            <p className="text-muted mt-2">오늘 등원이 이미 기록되어 있습니다.</p>
          </div>
        )}

        {view.kind === "notfound" && (
          <div className="text-center animate-fadeUp">
            <div className="mx-auto grid size-24 place-items-center rounded-full bg-rose-100 text-rose-500 mb-5">
              <CircleAlert className="size-14" />
            </div>
            <h1 className="text-2xl font-extrabold">일치하는 학생이 없어요</h1>
            <p className="text-muted mt-2">뒷자리를 다시 확인하거나 선생님께 문의해 주세요.</p>
            <button
              onClick={reset}
              className="mt-6 rounded-xl bg-brand-600 text-white font-semibold px-6 py-3 hover:bg-brand-700"
            >
              다시 입력
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function KeyBtn({
  children,
  onClick,
  disabled,
  variant = "num",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "num" | "muted";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-20 rounded-2xl text-3xl font-bold transition active:scale-95 disabled:opacity-40 grid place-items-center ${
        variant === "num"
          ? "bg-surface border border-line hover:bg-brand-50 hover:border-brand-300 text-ink shadow-sm"
          : "bg-canvas text-muted hover:bg-line"
      }`}
    >
      {children}
    </button>
  );
}
