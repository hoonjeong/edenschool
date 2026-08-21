"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}) {
  // 포털 대상: /reading 루트(폰트 클래스 유지). 없으면 body.
  // ⚠️ 포털이 없으면 transform 이 걸린 조상(<main class="animate-fadeUp">)이
  //    position:fixed 의 기준이 되어 모달이 화면이 아닌 문서 상단에 붙는다.
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setHost(
      (document.querySelector(".reading-root") as HTMLElement | null) ?? document.body,
    );
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !host) return null;

  const widths = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`relative z-10 my-auto flex max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] w-full ${widths[size]} flex-col rounded-2xl bg-surface shadow-[var(--shadow-pop)] animate-fadeUp`}
      >
        {title && (
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4">
            <h3 className="text-base font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="ml-auto grid size-8 place-items-center rounded-lg text-faint hover:bg-canvas hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {/* 내용이 길면 모달 안에서만 스크롤 (헤더·버튼은 항상 화면 안에 유지) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    host,
  );
}

/* 폼 입력 공통 스타일 */
export const inputCls =
  "w-full h-10 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition";
export const labelCls = "block text-[13px] font-semibold text-ink mb-1.5";
