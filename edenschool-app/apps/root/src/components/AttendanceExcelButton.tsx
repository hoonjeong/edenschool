// 출석부(엑셀) 다운로드 버튼 — 수강반 정보/담당반 명단 화면 공용.
// 평범한 GET 폼이라 자바스크립트 없이도 동작하고, 서버가 Content-Disposition으로
// 내려주므로 제출하면 바로 다운로드된다(페이지 이동 없음).

/** 서버 시간대가 UTC여도 한국 기준 연·월이 나오도록 +9시간 해서 UTC 필드로 읽는다. */
function kstYearMonth(): { year: number; month: number } {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return { year: kst.getUTCFullYear(), month: kst.getUTCMonth() + 1 };
}

export function AttendanceExcelButton({ classId }: { classId: number | string }) {
  const { year, month } = kstYearMonth();
  const years = [year - 1, year, year + 1];

  return (
    <form action="/api/admin/class/attendance" method="get" className="form-inline">
      <input type="hidden" name="id" value={classId} />
      <select name="year" defaultValue={year} className="form-control form-control-sm mr-1" aria-label="연도">
        {years.map((y) => (
          <option key={y} value={y}>{y}년</option>
        ))}
      </select>
      <select name="month" defaultValue={month} className="form-control form-control-sm mr-1" aria-label="월">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>{m}월</option>
        ))}
      </select>
      <button type="submit" className="btn btn-success btn-sm">
        <i className="fas fa-file-excel"></i> 출석부 제작
      </button>
    </form>
  );
}
