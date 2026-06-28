import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { selectActivePopups } from '@edenschool/common/queries/site-config';

export const GET = withErrorHandler(async () => {
  const popups = await selectActivePopups();
  // image_file_id가 있는 것만 노출
  const list = popups.filter((p) => p.image_file_id);
  return NextResponse.json({ popups: list });
});
