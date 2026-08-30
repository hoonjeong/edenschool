import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { updateClassStatus, restartClassStatus, deleteClassStatusById } from '@edenschool/common/queries/class';
import { toId } from '@/lib/params';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const body = await req.json();
    const id = toId(body.id);
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 });
    }
    const action = body.action as string;

    if (action === 'END') {
      await updateClassStatus(id, 0);
    } else if (action === 'RE') {
      await restartClassStatus(id, 1);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Update class status error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update class status' }, { status: 500 });
  }
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const { searchParams } = new URL(req.url);
    const id = toId(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    await deleteClassStatusById(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete class status error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete class status' }, { status: 500 });
  }
});
