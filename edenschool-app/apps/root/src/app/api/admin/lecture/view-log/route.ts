import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectLectureViewLogs, selectLectureViewLogsByDate } from '@edenschool/common/queries/lecture-view-log';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const startDate = req.nextUrl.searchParams.get('startDate');
  const endDate = req.nextUrl.searchParams.get('endDate');

  let logs;
  if (startDate && endDate) {
    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }
    // 최대 31일 범위 제한
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0 || diffDays > 31) {
      return NextResponse.json({ error: 'Date range must be within 31 days' }, { status: 400 });
    }
    logs = await selectLectureViewLogsByDate(startDate, endDate);
  } else {
    logs = await selectLectureViewLogs(200);
  }

  return NextResponse.json({ logs });
});
