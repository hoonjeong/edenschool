import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { insertDream, checkMyDream } from '@edenschool/common/queries/dream';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { name, id1, id2, type } = await req.json();

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }
  if (!id1 || !id2 || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const exists = await checkMyDream(session.user.id, id1, id2);
  if (exists) {
    return NextResponse.json({ error: '이미 추가된 항목입니다.' });
  }

  await insertDream(session.user.id, name, id1, id2, type);
  return NextResponse.json({ success: true });
});
