import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import type { ClassInfo, Student } from '@edenschool/common/types';
import { attendanceFileName, buildAttendanceWorkbook, parseWeekdays, sessionDates } from './attendance-excel';

const cls = (over: Partial<ClassInfo> = {}): ClassInfo => ({
  id: 1,
  name: '상원고3',
  subject: '국어',
  teacherOne: '김보름',
  teacherTwo: '',
  grade: '고',
  year: '3',
  day: '일',
  hour: 14,
  minute: 30,
  price: 0,
  limitCount: 30,
  liveStatus: 1,
  ...over,
});

const students = (n: number): Student[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `학생${i + 1}`,
    school: '부천고',
    grade: '고',
    year: 3,
    sphone: `0101234${String(1000 + i)}`,
    pphone: '010-9876-5432',
    address: '',
    specialty: '',
    memo: '',
  }));

async function load(buf: Buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  return wb.worksheets[0];
}

describe('parseWeekdays', () => {
  it('한 글자 요일을 읽는다', () => {
    expect(parseWeekdays('일')).toEqual([0]);
    expect(parseWeekdays('수')).toEqual([3]);
  });

  it('"토요일"의 일 을 일요일로 오인하지 않는다', () => {
    expect(parseWeekdays('토요일')).toEqual([6]);
    expect(parseWeekdays('일요일')).toEqual([0]);
  });

  it('여러 요일을 정렬해 돌려준다', () => {
    expect(parseWeekdays('수월')).toEqual([1, 3]);
  });

  it('요일이 없으면 빈 배열', () => {
    expect(parseWeekdays('')).toEqual([]);
    expect(parseWeekdays('미정')).toEqual([]);
  });
});

describe('sessionDates', () => {
  // 엑셀 일련번호 → 달력 날짜 (1899-12-30 기준)
  const toISO = (serial: number) =>
    new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000).toISOString().slice(0, 10);

  it('2026년 9월 일요일을 정확히 집는다', () => {
    expect(sessionDates(2026, 9, [0]).map(toISO)).toEqual([
      '2026-09-06',
      '2026-09-13',
      '2026-09-20',
      '2026-09-27',
    ]);
  });

  it('시간대와 무관하게 하루가 밀리지 않는다', () => {
    // JS Date 를 그대로 셀에 넣으면 KST 에서 하루 앞으로 밀렸던 회귀를 막는다.
    expect(sessionDates(2026, 9, [0]).map(toISO)[0]).toBe('2026-09-06');
  });

  it('최대 6회까지만 (양식의 날짜 칸 수)', () => {
    expect(sessionDates(2026, 9, [1, 3]).length).toBe(6);
  });

  it('요일이 없으면 빈 배열', () => {
    expect(sessionDates(2026, 9, [])).toEqual([]);
  });
});

describe('attendanceFileName', () => {
  it('반 이름과 연월을 담는다', () => {
    expect(attendanceFileName(cls(), 2026, 9)).toBe('상원고3 2026년 9월 출석부.xlsx');
  });

  it('파일명에 못 쓰는 문자를 걸러낸다', () => {
    expect(attendanceFileName(cls({ name: 'A/B:C' }), 2026, 9)).toBe('A B C 2026년 9월 출석부.xlsx');
  });
});

describe('buildAttendanceWorkbook', () => {
  it('제목·머리글·학생 정보를 양식 위치에 넣는다', async () => {
    const ws = await load(await buildAttendanceWorkbook(cls(), students(2), 2026, 9));

    expect(ws.getCell('A1').value).toBe('상원고3 (일요일 오후 2시 30분)');
    expect(ws.getCell('B6').value).toBe('이름');
    expect(ws.getCell('C6').value).toBe('학교');
    expect(ws.getCell('D6').value).toBe('학생핸드폰');
    expect(ws.getCell('E6').value).toBe('부모핸드폰');
    expect(ws.getCell('F7').value).toBe('출석');
    expect(ws.getCell('G7').value).toBe('사유');

    expect(ws.getCell('A8').value).toBe(1);
    expect(ws.getCell('B8').value).toBe('학생1');
    expect(ws.getCell('C8').value).toBe('부천고');
    expect(ws.getCell('D8').value).toBe('010-1234-1000');
    expect(ws.getCell('E8').value).toBe('010-9876-5432');
  });

  it('반 이름에 학년이 이미 있으면 중복해 붙이지 않는다', async () => {
    const ws = await load(await buildAttendanceWorkbook(cls({ name: '정규A' }), students(1), 2026, 9));
    expect(ws.getCell('A1').value).toBe('정규A 고3 (일요일 오후 2시 30분)');
  });

  it('학생이 적어도 30칸을 채우고 번호를 매긴다', async () => {
    const ws = await load(await buildAttendanceWorkbook(cls(), students(3), 2026, 9));
    expect(ws.getCell('A37').value).toBe(30);
    expect(ws.getCell('B37').value).toBeFalsy();
  });

  it('학생이 30명을 넘으면 행을 늘린다', async () => {
    const ws = await load(await buildAttendanceWorkbook(cls(), students(35), 2026, 9));
    expect(ws.getCell('A42').value).toBe(35);
    expect(ws.getCell('B42').value).toBe('학생35');
  });

  it('수업일이 없는 칸은 "/" 로 남긴다', async () => {
    const ws = await load(await buildAttendanceWorkbook(cls(), students(1), 2026, 9));
    // 2026-09 일요일은 4회 → 5·6번째 칸은 비어 있다
    expect(ws.getCell('N6').value).toBe('/');
    expect(ws.getCell('P6').value).toBe('/');
  });

  it('A4 가로 한 장으로 인쇄되도록 설정한다', async () => {
    const ws = await load(await buildAttendanceWorkbook(cls(), students(1), 2026, 9));
    expect(ws.pageSetup.paperSize).toBe(9);
    expect(ws.pageSetup.orientation).toBe('landscape');
    expect(ws.pageSetup.fitToPage).toBe(true);
    expect(ws.pageSetup.fitToWidth).toBe(1);
    expect(ws.pageSetup.fitToHeight).toBe(1);
  });
});
