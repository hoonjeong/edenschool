import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectTeacherList } from '@edenschool/common/queries/admin-user';

export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const rows = await selectTeacherList();

    return NextResponse.json({ teachers: rows });
  } catch (error) {
    console.error('Get teachers error:', error);
    return NextResponse.json([], { status: 500 });
  }
});
