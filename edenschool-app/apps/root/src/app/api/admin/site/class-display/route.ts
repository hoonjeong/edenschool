import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import {
  selectClassDisplayListAdmin,
  insertClassDisplay,
  updateClassDisplay,
  deleteClassDisplay,
} from '@edenschool/common/queries/site-config';

export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();
  const list = await selectClassDisplayListAdmin();
  return NextResponse.json({ list });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const body = await req.json();
  const id = await insertClassDisplay({
    class_id: body.class_id,
    teacher_image_file_id: body.teacher_image_file_id || null,
    description: body.description || '',
    progress_info: body.progress_info || '',
    clinic_info: body.clinic_info || '',
    introduction: body.introduction || '',
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ? 1 : 0,
  });
  return NextResponse.json({ success: true, id });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  await updateClassDisplay(body.id, {
    class_id: body.class_id,
    teacher_image_file_id: body.teacher_image_file_id || null,
    description: body.description || '',
    progress_info: body.progress_info || '',
    clinic_info: body.clinic_info || '',
    introduction: body.introduction || '',
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ? 1 : 0,
  });
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  await deleteClassDisplay(id);
  return NextResponse.json({ success: true });
});
