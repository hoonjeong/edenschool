import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { deleteFileStatusById } from '@edenschool/common/queries/file';
import { toId } from '@/lib/params';

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const { searchParams } = new URL(req.url);
    const fid = toId(searchParams.get('fid'));
    const lid = toId(searchParams.get('lid'));

    if (!fid || !lid) {
      return NextResponse.json({ ok: false, error: 'Missing fid or lid' }, { status: 400 });
    }

    await deleteFileStatusById(fid, lid);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete file status error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete file status' }, { status: 500 });
  }
});
