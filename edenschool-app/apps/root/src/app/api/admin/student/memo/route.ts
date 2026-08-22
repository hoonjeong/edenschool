import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import {
  selectStudentMemos,
  insertStudentMemo,
  deleteStudentMemo,
  updateStudentMemo,
} from '@edenschool/common/queries/student-record';

// 메모 목록
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) {
    return NextResponse.json({ error: 'studentId가 필요합니다.' }, { status: 400 });
  }

  const memos = await selectStudentMemos(Number(studentId));
  return NextResponse.json({ memos });
});

// 메모 추가
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const body = await req.json();
  const studentId = Number(body.studentId);
  const content = (body.content as string || '').trim();

  if (!studentId || !content) {
    return NextResponse.json({ error: '내용을 입력하세요.' }, { status: 400 });
  }

  const id = await insertStudentMemo(studentId, content);
  return NextResponse.json({ ok: true, id });
});

// 메모 수정
export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const body = await req.json();
  const id = Number(body.id);
  const content = (body.content as string || '').trim();

  if (!id || !content) {
    return NextResponse.json({ error: '내용을 입력하세요.' }, { status: 400 });
  }

  const affected = await updateStudentMemo(id, content);
  if (affected === 0) {
    return NextResponse.json({ error: '해당 상담 기록을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

// 메모 삭제
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  await deleteStudentMemo(Number(id));
  return NextResponse.json({ ok: true });
});
