import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { deleteDream } from '@edenschool/common/queries/dream';

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireApiSession();

  const { id } = await params;
  await deleteDream(Number(id));
  return NextResponse.json({ success: true });
});
