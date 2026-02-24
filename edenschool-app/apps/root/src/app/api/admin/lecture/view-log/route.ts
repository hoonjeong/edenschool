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
    logs = await selectLectureViewLogsByDate(startDate, endDate);
  } else {
    logs = await selectLectureViewLogs(200);
  }

  return NextResponse.json({ logs });
});
