import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import {
  selectTeacherDisplayList,
  insertTeacherDisplay,
  updateTeacherDisplay,
  deleteTeacherDisplay,
} from '@edenschool/common/queries/site-config';

export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();
  const list = await selectTeacherDisplayList();
  return NextResponse.json({ list });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const body = await req.json();
  const id = await insertTeacherDisplay({
    section: body.section,
    branch: body.branch || null,
    school: body.school || null,
    name: body.name,
    role: body.role || null,
    photo_url: body.photo_url || null,
    photo_file_id: body.photo_file_id || null,
    schedule_data: body.schedule_data || null,
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
  await updateTeacherDisplay(body.id, {
    section: body.section,
    branch: body.branch || null,
    school: body.school || null,
    name: body.name,
    role: body.role || null,
    photo_url: body.photo_url || null,
    photo_file_id: body.photo_file_id || null,
    schedule_data: body.schedule_data || null,
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
  await deleteTeacherDisplay(id);
  return NextResponse.json({ success: true });
});
