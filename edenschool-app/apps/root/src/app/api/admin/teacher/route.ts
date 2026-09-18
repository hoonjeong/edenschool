import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { isAssignableRole, isManageableRole } from '@/lib/admin-roles';
import { findAcaPart } from '@/lib/aca-parts';
import {
  selectTeacherUserList,
  selectTeacherUserById,
  insertTeacherUser,
  updateTeacherUser,
  deleteTeacherUser,
  selectAcaPartByTeacherId,
  upsertAcaPart,
} from '@edenschool/common/queries/admin-user';
import { toId } from '@/lib/params';

// GET: 선생님 목록 또는 단건 조회
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireOwnerApiSession();

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');
  const id = toId(idParam);
  // 값은 왔는데 형식이 잘못된 경우는 목록을 돌려주지 않고 명시적으로 거절한다.
  if (idParam && !id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    if (id) {
      const teacher = await selectTeacherUserById(id);
      if (!teacher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      // 근무 관은 별도 테이블이라 조회 실패해도 선생님 정보는 돌려준다.
      let acaPart: { part: number; acaPhone: string } | null = null;
      try {
        acaPart = await selectAcaPartByTeacherId(id);
      } catch (e) {
        console.error('aca_part fetch error:', e);
      }
      return NextResponse.json({ teacher, acaPart });
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
    const { name, phone, code, acaPart } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: '이름과 핸드폰번호를 입력해주세요.' }, { status: 400 });
    }
    if (!isAssignableRole(code)) {
      return NextResponse.json({ error: '역할을 올바르게 선택해주세요.' }, { status: 400 });
    }
    // 근무 관은 선택 항목 — 보내온 경우에만 검증한다.
    const part = acaPart === undefined || acaPart === null || acaPart === '' ? null : findAcaPart(acaPart);
    if (part === undefined) {
      return NextResponse.json({ error: '근무 관을 올바르게 선택해주세요.' }, { status: 400 });
    }

    const id = await insertTeacherUser(name.trim(), phone.trim(), code);
    if (part) {
      await upsertAcaPart(id, part.part, part.phone);
    }
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
    const { id, name, email, phone, code, acaPart } = body;

    if (!id || !name || !phone) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
    }
    // 역할은 선택 항목 — 보내온 경우에만 검증 후 변경(기존 운영진 O 유지 가능)
    if (code !== undefined && !isManageableRole(code)) {
      return NextResponse.json({ error: '역할을 올바르게 선택해주세요.' }, { status: 400 });
    }
    // 근무 관도 선택 항목 — 안 보내면 기존 aca_part 행을 건드리지 않는다.
    const part = acaPart === undefined || acaPart === null || acaPart === '' ? null : findAcaPart(acaPart);
    if (part === undefined) {
      return NextResponse.json({ error: '근무 관을 올바르게 선택해주세요.' }, { status: 400 });
    }

    await updateTeacherUser(id, name.trim(), (email || '').trim(), phone.trim(), code);
    if (part) {
      await upsertAcaPart(Number(id), part.part, part.phone);
    }
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
    const id = toId(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    await deleteTeacherUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Teacher delete error:', error);
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 });
  }
});
