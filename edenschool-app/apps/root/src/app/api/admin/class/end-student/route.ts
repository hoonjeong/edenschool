import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { updateClassStatus } from '@edenschool/common/queries/class';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const formData = await req.formData();
  const csId = Number(formData.get('csId'));
  const classId = formData.get('classId');

  if (!csId) {
    return NextResponse.redirect(buildUrl('/admin/class-manager', req));
  }

  try {
    await updateClassStatus(csId, 0);
  } catch (error) {
    console.error('End student error:', error);
  }

  return NextResponse.redirect(buildUrl(`/admin/class-info?id=${classId}`, req));
});
