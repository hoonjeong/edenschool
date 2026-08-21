// 반(Class)의 시간표는 '월·목 15:00' 같은 자유 텍스트다.
// 출결 화면에서 '오늘 등원하는 반'만 추리기 위해 여기서 요일을 뽑아 낸다.

export const WEEKDAY_CHARS = "일월화수목금토";

const SEP = /[\s,、·ㆍ/|\-~+()[\]:_]/;

/**
 * 자유 텍스트 시간표에서 요일을 추출한다. (0=일 … 6=토)
 * '수업', '금주' 처럼 요일 글자가 다른 낱말에 섞인 경우는 세지 않도록,
 * 앞뒤가 구분자·요일글자·'요'·숫자일 때만 요일로 인정한다.
 */
export function parseWeekdays(schedule?: string | null): number[] {
  const t = (schedule ?? "").trim();
  if (!t) return [];

  const found = new Set<number>();
  for (let i = 0; i < t.length; i++) {
    const k = WEEKDAY_CHARS.indexOf(t[i]);
    if (k < 0) continue;
    const prev = t[i - 1];
    const next = t[i + 1];
    const prevOk = prev === undefined || SEP.test(prev) || WEEKDAY_CHARS.includes(prev);
    const nextOk =
      next === undefined ||
      SEP.test(next) ||
      WEEKDAY_CHARS.includes(next) ||
      next === "요" ||
      /\d/.test(next);
    if (prevOk && nextOk) found.add(k);
  }
  return [...found].sort((a, b) => a - b);
}

/** 요일 번호 배열을 '월·목' 형태로 표기한다. */
export function formatWeekdays(days: number[]): string {
  return days.map((d) => WEEKDAY_CHARS[d]).join("·");
}
