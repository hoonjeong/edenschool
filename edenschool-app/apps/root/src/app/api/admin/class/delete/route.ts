import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { deleteClass } from '@edenschool/common/queries/class';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const formData = await req.formData();
  const id = Number(formData.get('id'));

  if (!id) {
    return NextResponse.redirect(new URL('/admin/class-manager', req.url));
  }

  try {
    await deleteClass(id);
  } catch (error) {
    console.error('Class delete error:', error);
  }

  return NextResponse.redirect(new URL('/admin/class-manager', req.url));
});
