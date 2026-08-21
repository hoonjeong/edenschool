/* 입학 테스트(문해력 진단 평가) 공통 상수·계산.
   서버(page/actions)와 클라이언트(입력·리포트) 양쪽에서 함께 쓴다. */

/** 시험지 종류 — DB에는 코드(ESEO/IROOM/EDEN)로 저장한다. */
export const EXAM_TYPES = [
  { code: "ESEO", label: "이서" },
  { code: "IROOM", label: "이룸" },
  { code: "EDEN", label: "이든" },
] as const;

export type ExamTypeCode = (typeof EXAM_TYPES)[number]["code"];

export const EXAM_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  EXAM_TYPES.map((t) => [t.code, t.label]),
);

export function examTitle(type: string, round: number) {
  return `${EXAM_TYPE_LABEL[type] ?? type} ${round}회차`;
}

/** 문항 수(엑셀 양식 기준 30문항 고정) */
export const ITEM_COUNT = 30;

/** 영역 — 목록에 없는 값도 직접 입력할 수 있다(입력창은 datalist). */
export const AREAS = ["듣기말하기", "어휘", "문법", "읽기", "쓰기", "문학", "매체"];

/** 독해능력(수준) — 공란 가능 */
export const ABILITIES = ["사실적 독해", "추론적 독해", "수용과 생산", "작품 이해"];

/** 차트·표에서 쓰는 영역 색 */
export const AREA_COLOR: Record<string, string> = {
  듣기말하기: "#6366f1",
  어휘: "#0ea5e9",
  문법: "#10b981",
  읽기: "#f59e0b",
  쓰기: "#ec4899",
  문학: "#8b5cf6",
  매체: "#14b8a6",
};

export interface ExamItemLike {
  no: number;
  answer: number;
  score: number;
  area: string;
  ability: string | null;
  note: string | null;
}

/** 학생 답 JSON 문자열 → 배열(길이 = 문항 수, 미기재는 null) */
export function parseAnswers(raw: string | null | undefined, count = ITEM_COUNT): (number | null)[] {
  let list: unknown = [];
  try {
    list = raw ? JSON.parse(raw) : [];
  } catch {
    list = [];
  }
  const arr = Array.isArray(list) ? list : [];
  return Array.from({ length: count }, (_, i) => {
    const v = arr[i];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  });
}

export function stringifyAnswers(answers: (number | null)[]) {
  return JSON.stringify(answers.map((a) => (a == null ? null : Number(a))));
}

/** 채점 — 맞힌 문항의 배점 합계 */
export function gradeTotal(items: ExamItemLike[], answers: (number | null)[]) {
  return items.reduce((sum, it) => {
    const given = answers[it.no - 1];
    return given != null && given === it.answer ? sum + it.score : sum;
  }, 0);
}

export function totalPossible(items: ExamItemLike[]) {
  return items.reduce((s, it) => s + it.score, 0);
}

/** 키(영역/독해능력)별 만점·득점 집계. 키가 빈 값인 문항은 제외. */
export function groupScores(
  items: ExamItemLike[],
  answers: (number | null)[],
  pick: (it: ExamItemLike) => string | null,
): { key: string; full: number; score: number }[] {
  const map = new Map<string, { full: number; score: number }>();
  const order: string[] = [];
  for (const it of items) {
    const key = (pick(it) ?? "").trim();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, { full: 0, score: 0 });
      order.push(key);
    }
    const cur = map.get(key)!;
    cur.full += it.score;
    const given = answers[it.no - 1];
    if (given != null && given === it.answer) cur.score += it.score;
  }
  return order.map((key) => ({ key, ...map.get(key)! }));
}

/** 여러 응시자의 평균(키별). 결과가 없으면 빈 맵. */
export function averageByKey(
  items: ExamItemLike[],
  allAnswers: (number | null)[][],
  pick: (it: ExamItemLike) => string | null,
): Map<string, number> {
  const sums = new Map<string, number>();
  for (const answers of allAnswers) {
    for (const g of groupScores(items, answers, pick)) {
      sums.set(g.key, (sums.get(g.key) ?? 0) + g.score);
    }
  }
  const n = allAnswers.length || 1;
  return new Map([...sums].map(([k, v]) => [k, Math.round((v / n) * 10) / 10]));
}

/** 문항별 오답률(%) — 응시자 기준. 응시자가 없으면 null. */
export function wrongRates(items: ExamItemLike[], allAnswers: (number | null)[][]): (number | null)[] {
  const n = allAnswers.length;
  return items.map((it) => {
    if (n === 0) return null;
    const wrong = allAnswers.filter((ans) => ans[it.no - 1] !== it.answer).length;
    return Math.round((wrong / n) * 100);
  });
}

export const round1 = (n: number) => Math.round(n * 10) / 10;
