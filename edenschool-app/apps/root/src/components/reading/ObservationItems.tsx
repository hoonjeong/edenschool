"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LevelChip } from "./ui";

export interface ObsItemView {
  area?: string;
  item: string;
  level: "상" | "중" | "하";
  text?: string;
  note?: string;
}

/**
 * 관찰 항목을 '등급 + 항목명 + 자동 생성 문장'까지 한 번에 보여 준다.
 * 항목이 많은 목록 화면에서는 collapsible로 접었다 펼 수 있게 한다.
 */
export default function ObservationItems({
  items,
  previewCount = 5,
  collapsible = true,
}: {
  items: ObsItemView[];
  previewCount?: number;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const canCollapse = collapsible && items.length > previewCount;
  const shown = canCollapse && !open ? items.slice(0, previewCount) : items;

  if (items.length === 0) return null;

  return (
    <div>
      <ul className="space-y-2.5">
        {shown.map((it, i) => (
          <li key={i} className="flex gap-2">
            <LevelChip level={it.level} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">
                {it.item}
                {it.area && <span className="ml-1.5 text-[11px] font-normal text-faint">{it.area}</span>}
              </div>
              {it.text && <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{it.text}</p>}
              {it.note && <p className="mt-0.5 text-[12px] text-faint">메모 · {it.note}</p>}
            </div>
          </li>
        ))}
      </ul>
      {canCollapse && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:text-brand-800"
        >
          {open ? (
            <>
              <ChevronUp className="size-3.5" /> 접기
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" /> 나머지 {items.length - previewCount}항목 문장 보기
            </>
          )}
        </button>
      )}
    </div>
  );
}
