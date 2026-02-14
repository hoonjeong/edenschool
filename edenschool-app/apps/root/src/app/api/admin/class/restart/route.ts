import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { restartClass } from '@edenschool/common/queries/class';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const formData = await req.formData();
  const id = Number(formData.get('id'));

  if (!id) {
    return NextResponse.redirect(new URL('/admin/class-manager', req.url));
  }

  try {
    await restartClass(id);
  } catch (error) {
    console.error('Class restart error:', error);
  }

  const referer = req.headers.get('referer') || '';
  const dest = referer.includes('class-manager') ? '/admin/class-manager' : `/admin/class-info?id=${id}`;
  return NextResponse.redirect(new URL(dest, req.url));
});
