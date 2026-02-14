import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectPhoneByClassIds } from '@edenschool/common/queries/sms-log';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([]);
    }

    const rows = await selectPhoneByClassIds(ids);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Get phones error:', error);
    return NextResponse.json([], { status: 500 });
  }
});
