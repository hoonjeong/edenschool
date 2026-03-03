import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { selectClassDisplayListActive } from '@edenschool/common/queries/site-config';

export const GET = withErrorHandler(async () => {
  const list = await selectClassDisplayListActive();
  return NextResponse.json({ list });
});
