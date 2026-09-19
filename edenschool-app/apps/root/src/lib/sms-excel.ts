import 'server-only';
import ExcelJS from 'exceljs';
import {
  dedupeRecipients,
  isExampleRow,
  isNameHeader,
  isPhoneHeader,
  normalizeRecipientPhone,
  type ParsedRecipient,
  type RecipientParseResult,
} from './sms-recipients';

// 「엑셀로 발송」 — 샘플 양식 생성과 업로드 파일 파싱. 파싱만 하고 발송은 하지 않는다.
// (발송은 기존 /api/admin/sms 가 번호 목록을 받아 처리한다)

export const SMS_EXCEL_SHEET = '발송대상';
export const SMS_EXCEL_MAX_ROWS = 2000;

/** 셀 값을 문자열로 — 수식·리치텍스트·하이퍼링크 등 exceljs 객체 값을 풀어준다. */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const v = value as unknown as Record<string, unknown>;
    if ('richText' in v) return (v.richText as { text: string }[]).map((t) => t.text).join('').trim();
    if ('text' in v) return String(v.text).trim();
    if ('result' in v) return String(v.result ?? '').trim();
    if (value instanceof Date) return '';
    return String(value).trim();
  }
  return String(value).trim();
}

export async function buildSmsExcelTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = '이든배움 관리자';

  const ws = wb.addWorksheet(SMS_EXCEL_SHEET);
  ws.columns = [
    { header: '이름', key: 'name', width: 16 },
    { header: '휴대폰번호', key: 'phone', width: 20 },
  ];
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.height = 22;
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  // 번호 열은 텍스트 서식 — 숫자로 저장되면 엑셀이 앞 0 을 지운다
  ws.getColumn('phone').numFmt = '@';
  ws.getColumn('phone').alignment = { horizontal: 'left' };

  ws.addRow(['예) 홍길동', '010-1234-5678']);
  ws.addRow(['예) 김학생', '01098765432']);

  const guide = wb.addWorksheet('안내');
  guide.getColumn(1).width = 90;
  const lines: [string, boolean][] = [
    ['문자 일괄발송 양식', true],
    ['', false],
    ['· "발송대상" 시트의 휴대폰번호 열에 번호를 한 줄에 하나씩 입력하세요. (이름은 선택)', false],
    ['· 010-1234-5678, 01012345678 형식 모두 가능합니다. 하이픈은 있어도 되고 없어도 됩니다.', false],
    ['· "예)" 로 시작하는 예시 행은 발송되지 않습니다. 지우거나 그대로 두어도 됩니다.', false],
    ['· 같은 번호가 여러 번 있으면 한 번만 발송됩니다.', false],
    [`· 한 파일에 최대 ${SMS_EXCEL_MAX_ROWS}행까지 읽습니다.`, false],
  ];
  for (const [text, bold] of lines) {
    const r = guide.addRow([text]);
    r.getCell(1).font = { bold, size: bold ? 12 : 11 };
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/**
 * 업로드된 엑셀에서 발송 대상을 추출한다.
 * - 머리글에서 번호/이름 열을 찾는다. 머리글이 없으면 번호처럼 보이는 첫 열을 쓴다.
 * - 첫 번째 시트만 읽는다(샘플 양식이면 "발송대상").
 */
export async function parseSmsExcel(buf: Buffer): Promise<RecipientParseResult & { sheet: string; scanned: number }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ws = wb.getWorksheet(SMS_EXCEL_SHEET) ?? wb.worksheets[0];
  if (!ws) throw new Error('시트를 찾을 수 없습니다.');

  // 머리글 탐색: 1행에서 번호/이름 열 결정
  const first = ws.getRow(1);
  let phoneCol = 0;
  let nameCol = 0;
  first.eachCell((cell, col) => {
    const t = cellText(cell.value);
    if (!phoneCol && isPhoneHeader(t)) phoneCol = col;
    else if (!nameCol && isNameHeader(t)) nameCol = col;
  });
  const hasHeader = phoneCol > 0;

  // 머리글이 없으면 데이터에서 번호처럼 보이는 첫 열을 번호 열로 본다
  if (!hasHeader) {
    outer: for (let r = 1; r <= Math.min(ws.rowCount, 20); r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= row.cellCount; c++) {
        if (normalizeRecipientPhone(cellText(row.getCell(c).value))) {
          phoneCol = c;
          break outer;
        }
      }
    }
    if (!phoneCol) throw new Error('휴대폰번호 열을 찾을 수 없습니다. 샘플 양식을 확인해주세요.');
  }

  const items: ParsedRecipient[] = [];
  let scanned = 0;
  const startRow = hasHeader ? 2 : 1;
  const endRow = Math.min(ws.rowCount, startRow + SMS_EXCEL_MAX_ROWS - 1);
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    const rawPhone = cellText(row.getCell(phoneCol).value);
    const name = nameCol ? cellText(row.getCell(nameCol).value) : '';
    if (!rawPhone && !name) continue; // 빈 행
    if (isExampleRow(name) || isExampleRow(rawPhone)) continue;
    scanned += 1;
    items.push({
      phone: normalizeRecipientPhone(rawPhone) ?? '',
      name: name || undefined,
      source: rawPhone || '(비어 있음)',
      row: r,
    });
  }

  return { ...dedupeRecipients(items), sheet: ws.name, scanned };
}
