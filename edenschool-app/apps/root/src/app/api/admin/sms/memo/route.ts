import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectMemoByTeacherId, insertMemo, updateMemoByTeacherId } from '@edenschool/common/queries/sms-log';

// GET: Fetch memo for the logged-in teacher
export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const teacherId = session.user.id;
    const memo = await selectMemoByTeacherId(teacherId);

    return NextResponse.json({ memo });
  } catch (error) {
    console.error('Get SMS memo error:', error);
    return NextResponse.json({ memo: null }, { status: 500 });
  }
});

// POST: Save/update memo for the logged-in teacher
// Original: ActionSaveMemoController - uses session user id as teacher_id
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const body = await req.json();
    const { memo } = body;
    const teacherId = session.user.id;

    // Upsert sms_memo record (matches original: check exists, then insert or update)
    const existing = await selectMemoByTeacherId(teacherId);

    if (existing !== null) {
      await updateMemoByTeacherId(teacherId, memo);
    } else {
      await insertMemo(teacherId, memo);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Save SMS memo error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to save SMS memo' }, { status: 500 });
  }
});
