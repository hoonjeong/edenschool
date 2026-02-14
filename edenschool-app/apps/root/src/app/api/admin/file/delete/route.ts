import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { deletePostFileStatusByFileId, deleteFileInfoById } from '@edenschool/common/queries/file';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const fileId = Number(id);
    await deletePostFileStatusByFileId(fileId);
    await deleteFileInfoById(fileId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
});
