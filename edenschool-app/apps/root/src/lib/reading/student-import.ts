import "server-only";
import ExcelJS from "exceljs";
import { prisma } from "./prisma";

const GRADES = ["초1", "초2", "초3", "초4", "초5", "초6"];
const STATUS_MAP: Record<string, "ENROLLED" | "PAUSED" | "WITHDRAWN"> = {
  재원: "ENROLLED",
  휴원: "PAUSED",
  퇴원: "WITHDRAWN",
};
const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

// ── 셀 값을 문자열로 정규화 ──────────────────────────────
function cellStr(row: ExcelJS.Row, idx: number): string {
  const v = row.getCell(idx).value as ExcelJS.CellValue;
  if (v == null) return "";
  if (typeof v === "object") {
    const anyv = v as unknown as Record<string, unknown>;
    if ("text" in anyv) return String(anyv.text).trim();
    if ("result" in anyv) return String(anyv.result).trim();
    if ("richText" in anyv)
      return (anyv.richText as { text: string }[]).map((t) => t.text).join("").trim();
    return String(v).trim();
  }
  return String(v).trim();
}

function isExample(name: string) {
  return name.startsWith("예)") || name.startsWith("(예");
}

// ── 샘플 양식(.xlsx) 생성 ────────────────────────────────
export async function generateTemplateBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "이든 클래스 매니저";

  // 안내 시트
  const guide = wb.addWorksheet("안내");
  guide.getColumn(1).width = 110;
  const guideLines: [string, boolean][] = [
    ["이든 클래스 매니저 · 학생/반 일괄 등록 양식", true],
    ["", false],
    ["■ 작성 순서", true],
    ["1) '반' 시트에 반 정보를 먼저 입력하세요. (반이름은 필수)", false],
    ["2) '학생' 시트에 학생 정보를 입력하세요. '반이름'은 '반' 시트 또는 기존에 등록된 반과 일치해야 합니다.", false],
    ["3) 각 시트의 '예)'로 시작하는 예시 행은 지우거나 그대로 두어도 됩니다. (예시 행은 임포트되지 않습니다)", false],
    ["4) 저장 후 학생 메뉴 → '엑셀 일괄 등록'에서 이 파일을 첨부하면 규칙 검증 후 일괄 등록됩니다.", false],
    ["", false],
    ["■ '반' 시트 규칙", true],
    ["· 반이름(필수) / 요일·시간 / 담당선생님(등록된 선생님 이름과 일치 시 자동 배정) / 정원(숫자, 미입력 시 8) / 색상(HEX, 선택)", false],
    ["· 이미 존재하는 반이름은 건너뜁니다(중복 생성 안 함).", false],
    ["", false],
    ["■ '학생' 시트 규칙", true],
    ["· 이름(필수)", false],
    ["· 학년(필수): 초1, 초2, 초3, 초4, 초5, 초6 중 하나", false],
    ["· 연락처(필수): 예) 010-1234-5678  → 뒷자리 4자리가 등원 체크인에 사용됩니다.", false],
    ["· 반이름(선택): 입력 시 '반' 시트/기존 반에 존재해야 합니다. 없는 반이면 해당 행은 건너뜁니다.", false],
    ["· 상태(선택): 재원 / 휴원 / 퇴원 (미입력 시 재원)", false],
    ["· 메모(선택)", false],
    ["", false],
    ["■ 검증에 실패한 행은 건너뛰고, 임포트 후 사유가 함께 표시됩니다.", true],
  ];
  guideLines.forEach(([text, bold]) => {
    const r = guide.addRow([text]);
    r.getCell(1).font = { bold, size: bold ? 12 : 11 };
    r.getCell(1).alignment = { wrapText: true, vertical: "middle" };
  });

  // 반 시트
  const cls = wb.addWorksheet("반");
  cls.columns = [
    { header: "반이름", key: "name", width: 24 },
    { header: "요일·시간", key: "schedule", width: 16 },
    { header: "담당선생님", key: "teacher", width: 16 },
    { header: "정원", key: "capacity", width: 8 },
    { header: "색상(선택,HEX)", key: "color", width: 16 },
  ];
  styleHeader(cls);
  cls.addRow(["예) 월·목 3:00 A반", "월·목 15:00", "김서연 선생님", 8, "#6366f1"]);
  cls.addRow(["예) 화·금 4:00 B반", "화·금 16:00", "", 8, "#0ea5e9"]);

  // 학생 시트
  const stu = wb.addWorksheet("학생");
  stu.columns = [
    { header: "이름", key: "name", width: 14 },
    { header: "학년", key: "grade", width: 8 },
    { header: "연락처", key: "phone", width: 18 },
    { header: "반이름", key: "class", width: 24 },
    { header: "상태", key: "status", width: 10 },
    { header: "메모", key: "memo", width: 30 },
  ];
  styleHeader(stu);
  stu.addRow(["예) 홍길동", "초3", "010-1234-5678", "월·목 3:00 A반", "재원", "특이사항 메모"]);
  stu.addRow(["예) 김철수", "초5", "010-2222-3333", "", "재원", ""]);

  // 드롭다운(학년/상태)
  for (let r = 2; r <= 300; r++) {
    stu.getCell(`B${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"초1,초2,초3,초4,초5,초6"'],
    };
    stu.getCell(`E${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"재원,휴원,퇴원"'],
    };
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

function styleHeader(ws: ExcelJS.Worksheet) {
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 22;
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

// ── 파싱·검증·임포트 ────────────────────────────────────
export interface ImportReport {
  classesCreated: string[];
  classesReused: string[];
  studentsCreated: number;
  studentsSkipped: { row: number; name: string; reason: string }[];
  classRowCount: number;
  studentRowCount: number;
}

function last4(phone: string) {
  return phone.replace(/\D/g, "").slice(-4);
}
function isHex(s: string) {
  return /^#?[0-9a-fA-F]{6}$/.test(s);
}

export async function parseAndImport(buffer: Buffer): Promise<ImportReport> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const report: ImportReport = {
    classesCreated: [],
    classesReused: [],
    studentsCreated: 0,
    studentsSkipped: [],
    classRowCount: 0,
    studentRowCount: 0,
  };

  // 선생님 이름 → id
  const teachers = await prisma.user.findMany({ where: { active: true } });
  const teacherByName = new Map(teachers.map((t) => [t.name, t.id]));

  // 기존 반 이름 → id
  const existing = await prisma.class.findMany();
  const classByName = new Map(existing.map((c) => [c.name, c.id]));

  // ── 반 시트 ──
  const wsClass = wb.getWorksheet("반");
  let colorIdx = 0;
  if (wsClass) {
    const rows: ExcelJS.Row[] = [];
    wsClass.eachRow((row, n) => {
      if (n > 1) rows.push(row);
    });
    for (const row of rows) {
      const name = cellStr(row, 1);
      if (!name || isExample(name)) continue;
      report.classRowCount++;
      if (classByName.has(name)) {
        report.classesReused.push(name);
        continue;
      }
      const schedule = cellStr(row, 2) || null;
      const teacherId = teacherByName.get(cellStr(row, 3)) ?? null;
      const capRaw = cellStr(row, 4);
      const capacity = capRaw && !isNaN(Number(capRaw)) ? Math.max(1, parseInt(capRaw, 10)) : 8;
      const colorRaw = cellStr(row, 5);
      const color = isHex(colorRaw)
        ? colorRaw.startsWith("#")
          ? colorRaw
          : `#${colorRaw}`
        : COLORS[colorIdx++ % COLORS.length];

      const created = await prisma.class.create({
        data: { name, schedule, teacherId, capacity, color },
      });
      classByName.set(name, created.id);
      report.classesCreated.push(name);
    }
  }

  // ── 학생 시트 ──
  const wsStu = wb.getWorksheet("학생");
  if (wsStu) {
    const rows: { row: ExcelJS.Row; n: number }[] = [];
    wsStu.eachRow((row, n) => {
      if (n > 1) rows.push({ row, n });
    });
    for (const { row, n } of rows) {
      const name = cellStr(row, 1);
      const grade = cellStr(row, 2);
      const phone = cellStr(row, 3);
      const className = cellStr(row, 4);
      const statusK = cellStr(row, 5) || "재원";
      const memo = cellStr(row, 6) || null;

      // 완전히 빈 행은 조용히 건너뜀
      if (!name && !grade && !phone && !className) continue;
      if (isExample(name)) continue;

      report.studentRowCount++;

      if (!name) {
        report.studentsSkipped.push({ row: n, name: "(빈 이름)", reason: "이름이 없습니다." });
        continue;
      }
      if (!GRADES.includes(grade)) {
        report.studentsSkipped.push({ row: n, name, reason: `학년 오류(초1~초6): '${grade || "없음"}'` });
        continue;
      }
      if (last4(phone).length < 4) {
        report.studentsSkipped.push({ row: n, name, reason: `연락처 오류: '${phone || "없음"}'` });
        continue;
      }
      const status = STATUS_MAP[statusK];
      if (!status) {
        report.studentsSkipped.push({ row: n, name, reason: `상태 오류(재원/휴원/퇴원): '${statusK}'` });
        continue;
      }
      let classId: number | null = null;
      if (className) {
        const found = classByName.get(className);
        if (found == null) {
          report.studentsSkipped.push({
            row: n,
            name,
            reason: `반 '${className}' 없음 — '반' 시트에 먼저 등록하세요.`,
          });
          continue;
        }
        classId = found;
      }

      await prisma.student.create({
        data: {
          name,
          grade,
          phone,
          phoneLast4: last4(phone),
          status,
          classId,
          memo,
        },
      });
      report.studentsCreated++;
    }
  }

  return report;
}
