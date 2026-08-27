import ExcelJS from 'exceljs';
import type { ClassInfo, Student } from '@edenschool/common/types';

// 출석부 엑셀 생성 — sample 양식(샘플.xlsx)을 그대로 재현한다.
//
// 레이아웃
//   1~5행   제목 (A1:Q5 병합, 36pt 굵게)
//   6~7행   머리글. 6행=날짜(회차별 2칸 병합), 7행=출석/사유
//           A~E(번호·이름·학교·학생핸드폰·부모핸드폰)는 6~7행 세로 병합
//   8행~    학생 1명당 1행. 최소 30칸을 만들어 빈 줄에도 번호와 테두리를 넣는다.
//
// 인쇄는 A4 가로 한 장에 들어가야 하므로 fitToWidth/fitToHeight를 모두 1로 강제한다.
// (샘플은 fitToWidth=0이라 가로로 넘칠 여지가 있었다.)

const SESSION_COUNT = 6; // 회차(날짜) 칸 수 — F/G, H/I, J/K, L/M, N/O, P/Q
const INFO_COL_COUNT = 5; // A~E
const TOTAL_COLS = INFO_COL_COUNT + SESSION_COUNT * 2; // 17 = Q
const TITLE_LAST_ROW = 5;
const HEAD_ROW = 6; // 날짜
const SUB_ROW = 7; // 출석/사유
const FIRST_DATA_ROW = 8;
const MIN_SLOTS = 30;

const FONT_NAME = '맑은 고딕';
const HEADER_FILL = 'FFA6A6A6'; // 샘플의 theme0 tint -0.35
const DATA_FILL = 'FFFFFFFF';
const DATE_FMT = 'mm"월" dd"일"';

const M: Partial<ExcelJS.Border> = { style: 'medium' };
const T: Partial<ExcelJS.Border> = { style: 'thin' };

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** class_info.day("일", "일요일", "월수" 등)에서 요일 번호(0=일)를 뽑는다. */
export function parseWeekdays(day: string | null | undefined): number[] {
  // "토요일"의 '일'을 토요일과 일요일 둘로 오인하지 않도록 "요일"을 먼저 지운다.
  const cleaned = (day || '').replace(/요일/g, '');
  const found = new Set<number>();
  for (const ch of cleaned) {
    const idx = WEEKDAYS.indexOf(ch);
    if (idx >= 0) found.add(idx);
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * 엑셀 날짜 일련번호(1899-12-30 기준). JS Date를 그대로 셀에 넣으면 exceljs가 UTC 순간으로
 * 환산해 한국 시간대에서 하루 밀리므로(2026-09-06 00:00 KST -> 9/5 15:00), 달력값에서 직접 계산한다.
 */
function excelSerial(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000) + 25_569;
}

/** 해당 연·월에서 반 요일에 해당하는 수업일의 엑셀 일련번호 (최대 SESSION_COUNT개). */
export function sessionDates(year: number, month: number, weekdays: number[]): number[] {
  if (weekdays.length === 0) return [];
  const serials: number[] = [];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= lastDay; d++) {
    const weekday = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    if (weekdays.includes(weekday)) serials.push(excelSerial(year, month, d));
  }
  return serials.slice(0, SESSION_COUNT);
}

function timeLabel(hour: number, minute: number): string {
  const h = Number(hour) || 0;
  const m = Number(minute) || 0;
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${ampm} ${h12}시 ${m}분` : `${ampm} ${h12}시`;
}

function dayLabel(day: string | null | undefined): string {
  const d = (day || '').trim();
  if (!d) return '';
  return d.endsWith('요일') ? d : `${d}요일`;
}

function formatPhone(value: string | null | undefined): string {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return (value || '').trim();
}

/** 반 이름에 이미 학년이 들어있으면 중복해서 붙이지 않는다. */
function classTitle(info: ClassInfo): string {
  const name = (info.name || '').trim();
  const grade = `${info.grade ?? ''}${info.year ?? ''}`.trim();
  const head = grade && !name.includes(grade) ? `${name} ${grade}` : name;
  const when = [dayLabel(info.day), timeLabel(info.hour, info.minute)].filter(Boolean).join(' ');
  return when ? `${head} (${when})` : head;
}

/** 엑셀 시트명 제약(31자, : \ / ? * [ ] 불가)에 맞춘다. */
function sheetName(info: ClassInfo): string {
  const h = Number(info.hour) || 0;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const m = Number(info.minute) || 0;
  const when = `${(info.day || '').replace(/요일/g, '')}${h12}시${m ? `${m}분` : ''}`;
  const raw = `${(info.name || '출석부').trim()} ${when}`.trim();
  return raw.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31) || '출석부';
}

export function attendanceFileName(info: ClassInfo, year: number, month: number): string {
  const base = `${(info.name || '출석부').trim()} ${year}년 ${month}월 출석부`;
  return `${base.replace(/[\\/:*?"<>|]/g, ' ')}.xlsx`;
}

export async function buildAttendanceWorkbook(
  info: ClassInfo,
  students: Student[],
  year: number,
  month: number,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = '이든배움국어학원';
  wb.created = new Date();

  const lastCol = TOTAL_COLS;
  const slots = Math.max(MIN_SLOTS, students.length);
  const lastRow = FIRST_DATA_ROW + slots - 1;

  const ws = wb.addWorksheet(sheetName(info), {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1, // 가로도 1장으로 강제 — A4 한 장 요건
      fitToHeight: 1,
      horizontalCentered: true,
      verticalCentered: true,
      margins: { left: 0.12, right: 0.12, top: 0.1, bottom: 0.1, header: 0, footer: 0 },
    },
  });

  // ── 열 너비 ───────────────────────────────────────────────
  // 샘플 기준. 학교(C)는 값을 채우므로 샘플의 3에서 넓혔다.
  ws.getColumn(1).width = 3.25; // 번호
  ws.getColumn(2).width = 8; // 이름
  ws.getColumn(3).width = 10; // 학교
  ws.getColumn(4).width = 13.625; // 학생핸드폰
  ws.getColumn(5).width = 13.625; // 부모핸드폰
  for (let s = 0; s < SESSION_COUNT; s++) {
    ws.getColumn(INFO_COL_COUNT + s * 2 + 1).width = 5.625; // 출석
    ws.getColumn(INFO_COL_COUNT + s * 2 + 2).width = 11.875; // 사유
  }

  // ── 제목 ──────────────────────────────────────────────────
  for (let r = 1; r <= TITLE_LAST_ROW; r++) ws.getRow(r).height = 13.5;
  ws.mergeCells(1, 1, TITLE_LAST_ROW, lastCol);
  const title = ws.getCell(1, 1);
  title.value = classTitle(info);
  title.font = { name: FONT_NAME, size: 36, bold: true };
  title.alignment = { horizontal: 'center', vertical: 'middle' };

  // ── 머리글 ────────────────────────────────────────────────
  ws.getRow(HEAD_ROW).height = 13.5;
  ws.getRow(SUB_ROW).height = 12;

  const headerBase = (cell: ExcelJS.Cell, bold: boolean) => {
    cell.font = { name: FONT_NAME, size: 10, bold };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  };

  // A~E: 6~7행 세로 병합
  const infoHeaders = ['', '이름', '학교', '학생핸드폰', '부모핸드폰'];
  for (let c = 1; c <= INFO_COL_COUNT; c++) {
    ws.mergeCells(HEAD_ROW, c, SUB_ROW, c);
    const cell = ws.getCell(HEAD_ROW, c);
    cell.value = infoHeaders[c - 1] || null;
    headerBase(cell, true);
    cell.border = {
      left: c === 1 ? M : T,
      right: c >= 4 ? M : T,
      top: M,
      bottom: M,
    };
    if (c >= 4) cell.numFmt = '@';
  }

  // 회차별: 6행 날짜(2칸 병합) / 7행 출석·사유
  const dates = sessionDates(year, month, parseWeekdays(info.day));
  for (let s = 0; s < SESSION_COUNT; s++) {
    const left = INFO_COL_COUNT + s * 2 + 1;
    const right = left + 1;

    ws.mergeCells(HEAD_ROW, left, HEAD_ROW, right);
    const dateCell = ws.getCell(HEAD_ROW, left);
    // 날짜가 있으면 실제 날짜 값 + 표시서식, 없으면 샘플처럼 "/" 자리표시.
    if (dates[s] !== undefined) {
      dateCell.value = dates[s]; // 엑셀 날짜 일련번호 + 표시서식
      dateCell.numFmt = DATE_FMT;
    } else {
      dateCell.value = '/';
    }
    headerBase(dateCell, true);
    dateCell.border = { left: M, right: M, top: M, bottom: M };

    for (const [idx, col] of [left, right].entries()) {
      const cell = ws.getCell(SUB_ROW, col);
      cell.value = idx === 0 ? '출석' : '사유';
      headerBase(cell, false);
      cell.numFmt = '@';
      cell.border = {
        left: idx === 0 ? M : T,
        right: idx === 0 ? T : M,
        top: M,
        bottom: M,
      };
    }
  }

  // ── 학생 행 ───────────────────────────────────────────────
  for (let i = 0; i < slots; i++) {
    const rowNum = FIRST_DATA_ROW + i;
    const row = ws.getRow(rowNum);
    row.height = 15.95;
    const student = students[i];
    const isLast = rowNum === lastRow;

    const values: (string | number | null)[] = [
      i + 1,
      student ? (student.name || '').trim() : null,
      student ? (student.school || '').trim() : null,
      student ? formatPhone(student.sphone) : null,
      student ? formatPhone(student.pphone) : null,
    ];

    for (let c = 1; c <= lastCol; c++) {
      const cell = row.getCell(c);
      if (c <= INFO_COL_COUNT) cell.value = values[c - 1];
      cell.font = { name: FONT_NAME, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DATA_FILL } };

      // 왼쪽 medium: 표 바깥(A)과 정보/출결 경계, 회차 사이 구분선
      const isSessionLeft = c > INFO_COL_COUNT && (c - INFO_COL_COUNT) % 2 === 1;
      cell.border = {
        left: c === 1 || isSessionLeft ? M : T,
        right: c === 4 || c === INFO_COL_COUNT || c === lastCol || (c > INFO_COL_COUNT && !isSessionLeft) ? M : T,
        top: T,
        bottom: isLast ? M : T,
      };
      if (c === 4 || c === 5) cell.numFmt = '@';
    }
  }

  // printArea는 설정하지 않는다. 사용 범위가 정확히 A1:Q{마지막행}과 같아 결과가 동일하고,
  // exceljs가 값 앞에 항상 $를 덧붙여 '$A1:$Q37' 같은 혼합참조를 만들어내기 때문이다.

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
