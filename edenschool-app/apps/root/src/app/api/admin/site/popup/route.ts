import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession, requireOwnerApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import {
  selectAllPopups,
  insertPopup,
  updatePopupById,
  deletePopupById,
} from '@edenschool/common/queries/site-config';

// 목록 조회
export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();
  const popups = await selectAllPopups();
  return NextResponse.json({ popups });
});

// 신규 팝업 추가
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();
  const body = await req.json();
  const id = await insertPopup({
    is_active: body.is_active ? 1 : 0,
    image_file_id: body.image_file_id || null,
    link_url: body.link_url || '',
    start_date: body.start_date || null,
    end_date: body.end_date || null,
  });
  return NextResponse.json({ success: true, id });
});

// 팝업 수정(활성/비활성 토글 포함)
export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();
  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  await updatePopupById(Number(body.id), {
    is_active: body.is_active ? 1 : 0,
    image_file_id: body.image_file_id || null,
    link_url: body.link_url || '',
    start_date: body.start_date || null,
    end_date: body.end_date || null,
  });
  return NextResponse.json({ success: true });
});

// 팝업 삭제
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  await deletePopupById(id);
  return NextResponse.json({ success: true });
});
