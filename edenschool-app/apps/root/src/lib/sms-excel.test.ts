import { describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';

// 'server-only' 는 Next 런타임 밖에서는 import 자체가 실패한다.
vi.mock('server-only', () => ({}));

const { buildSmsExcelTemplate, parseSmsExcel } = await import('./sms-excel');

async function sheetToBuffer(fill: (ws: ExcelJS.Worksheet) => void, name = 'Sheet1'): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  fill(wb.addWorksheet(name));
  return Buffer.from(await wb.xlsx.writeBuffer());
}

describe('sms-excel', () => {
  it('샘플 양식은 예시 행만 있어 발송 대상이 0건이다', async () => {
    const r = await parseSmsExcel(await buildSmsExcelTemplate());
    expect(r.sheet).toBe('발송대상');
    expect(r.valid).toHaveLength(0);
    expect(r.invalid).toHaveLength(0);
  });

  it('샘플 양식에 입력한 번호를 이름과 함께 읽는다', async () => {
    const buf = await sheetToBuffer((ws) => {
      ws.addRow(['이름', '휴대폰번호']);
      ws.addRow(['예) 홍길동', '010-1234-5678']);
      ws.addRow(['김학생', '010-1111-2222']);
      ws.addRow(['이학생', 1033334444]); // 숫자로 저장돼 앞 0 이 빠진 경우
      ws.addRow(['', '01011112222']); // 중복
      ws.addRow(['박학생', '02-123-4567']); // 유선 → 오류
      ws.addRow([]);
    }, '발송대상');
    const r = await parseSmsExcel(buf);
    expect(r.valid.map((v) => [v.name, v.phone, v.row])).toEqual([
      ['김학생', '01011112222', 3],
      ['이학생', '01033334444', 4],
    ]);
    expect(r.duplicates).toBe(1);
    expect(r.invalid.map((v) => v.row)).toEqual([6]);
    expect(r.scanned).toBe(4);
  });

  it('머리글이 없어도 번호처럼 보이는 열을 찾는다', async () => {
    const buf = await sheetToBuffer((ws) => {
      ws.addRow(['010-5555-6666']);
      ws.addRow(['010-7777-8888']);
    });
    const r = await parseSmsExcel(buf);
    expect(r.valid.map((v) => v.phone)).toEqual(['01055556666', '01077778888']);
  });

  it('번호 열을 찾지 못하면 오류를 낸다', async () => {
    const buf = await sheetToBuffer((ws) => {
      ws.addRow(['이름', '학교']);
      ws.addRow(['김학생', '부천고']);
    });
    await expect(parseSmsExcel(buf)).rejects.toThrow('휴대폰번호 열');
  });
});
