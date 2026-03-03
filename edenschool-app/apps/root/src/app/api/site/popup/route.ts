import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { selectActivePopup } from '@edenschool/common/queries/site-config';

export const GET = withErrorHandler(async () => {
  const popup = await selectActivePopup();
  if (!popup || !popup.image_file_id) {
    return NextResponse.json({ popup: null });
  }
  return NextResponse.json({ popup });
});
