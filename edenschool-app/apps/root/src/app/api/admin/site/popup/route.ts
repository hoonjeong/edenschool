import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession, requireOwnerApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectSitePopup, updateSitePopup } from '@edenschool/common/queries/site-config';

export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();
  const popup = await selectSitePopup();
  return NextResponse.json({ popup });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();
  const body = await req.json();
  const { is_active, image_file_id, link_url, start_date, end_date } = body;
  await updateSitePopup({
    is_active: is_active ? 1 : 0,
    image_file_id: image_file_id || null,
    link_url: link_url || '',
    start_date: start_date || null,
    end_date: end_date || null,
  });
  return NextResponse.json({ success: true });
});
