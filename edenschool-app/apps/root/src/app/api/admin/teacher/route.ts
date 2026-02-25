import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import {
  selectTeacherUserList,
  selectTeacherUserById,
  insertTeacherUser,
  updateTeacherUser,
  deleteTeacherUser,
} from '@edenschool/common/queries/admin-user';

// GET: 선생님 목록 또는 단건 조회
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireOwnerApiSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const teacher = await selectTeacherUserById(Number(id));
      if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ teacher });
    }
    const list = await selectTeacherUserList();
    return NextResponse.json({ teachers: list });
  } catch (error) {
    console.error('Teacher fetch error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
});

// POST: 선생님 추가
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  try {
    const body = await req.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: '이름과 핸드폰번호를 입력해주세요.' }, { status: 400 });
    }

    const id = await insertTeacherUser(name.trim(), phone.trim());
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Teacher insert error:', error);
    return NextResponse.json({ error: '선생님 추가에 실패했습니다.' }, { status: 500 });
  }
});

// PUT: 선생님 수정
export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  try {
    const body = await req.json();
    const { id, name, email, phone } = body;

    if (!id || !name || !phone) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
    }

    await updateTeacherUser(id, name.trim(), (email || '').trim(), phone.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher update error:', error);
    return NextResponse.json({ error: '수정에 실패했습니다.' }, { status: 500 });
  }
});

// DELETE: 선생님 삭제
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await deleteTeacherUser(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher delete error:', error);
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
  }
});
