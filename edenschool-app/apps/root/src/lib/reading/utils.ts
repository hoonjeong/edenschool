export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function fmtDate(d: Date | string | null | undefined, withYear = false) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ko-KR", {
    year: withYear ? "numeric" : undefined,
    month: "long",
    day: "numeric",
  }).format(date);
}

export function fmtDateShort(d: Date | string | null | undefined) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" })
    .format(date)
    .replace(/\.\s?$/, "");
}

export function fmtTime(d: Date | string | null | undefined) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function relativeDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const diff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86400000,
  );
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff === -1) return "어제";
  if (diff < 0) return `${-diff}일 전`;
  return `${diff}일 후`;
}

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const WEEKDAYS_MON_SAT = [
  { n: 1, label: "월" },
  { n: 2, label: "화" },
  { n: 3, label: "수" },
  { n: 4, label: "목" },
  { n: 5, label: "금" },
  { n: 6, label: "토" },
];

export function initials(name: string) {
  return name.slice(-2);
}

/* ── 클리닉 타임라인: 시간 헬퍼 ─────────────────────── */
// "HH:MM" → 분(0~1439). 형식이 아니면 null.
export function hhmmToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutesToHhmm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* ── 담당 선생님별 색상 ──────────────────────────────
   화면·인쇄 공용. bg/text/border(연한 파스텔) + dot(진한 점) 쌍.
   print 시에도 배경색이 보이도록 실제 색상값(inline style) 사용. */
export interface TeacherColor {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const TEACHER_PALETTE: TeacherColor[] = [
  { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe", dot: "#6366f1" }, // indigo
  { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", dot: "#10b981" }, // emerald
  { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", dot: "#f97316" }, // orange
  { bg: "#fdf2f8", text: "#be185d", border: "#fbcfe8", dot: "#ec4899" }, // pink
  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" }, // blue
  { bg: "#fefce8", text: "#a16207", border: "#fef08a", dot: "#eab308" }, // yellow
  { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe", dot: "#8b5cf6" }, // violet
  { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4", dot: "#14b8a6" }, // teal
  { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca", dot: "#ef4444" }, // red
  { bg: "#f7fee7", text: "#4d7c0f", border: "#d9f99d", dot: "#84cc16" }, // lime
];

// 담당 미지정(빈 값) 중립 색
export const NO_TEACHER_COLOR: TeacherColor = {
  bg: "#f1f5f9",
  text: "#475569",
  border: "#e2e8f0",
  dot: "#94a3b8",
};

// 담당 선생님명 목록 → 이름별 색상 맵. 정렬 후 인덱스 매핑으로 항상 동일 색.
export function assignTeacherColors(names: (string | null | undefined)[]): Map<string, TeacherColor> {
  const distinct = [...new Set(names.map((n) => (n ?? "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ko"),
  );
  const map = new Map<string, TeacherColor>();
  distinct.forEach((name, i) => map.set(name, TEACHER_PALETTE[i % TEACHER_PALETTE.length]));
  return map;
}

export function teacherColorOf(
  teacher: string | null | undefined,
  map: Map<string, TeacherColor>,
): TeacherColor {
  const key = (teacher ?? "").trim();
  return (key && map.get(key)) || NO_TEACHER_COLOR;
}
