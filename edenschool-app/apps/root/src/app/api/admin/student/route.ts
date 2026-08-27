import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireOwnerApiSession } from '@/lib/admin-session';
import { insertStudent, selectStudentsByNameAndPhone } from '@edenschool/common/queries/student';
import { insertStudentAnalysis } from '@edenschool/common/queries/admin-user';
import { normalizePhone } from '@edenschool/common/validation';
import { withTransaction } from '@edenschool/common/db';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  const body = await req.json();
  const name = ((body.name as string) || '').trim();
  const sphone = normalizePhone((body.sphone as string) || '');
  const pphone = normalizePhone((body.pphone as string) || '');
  const student = {
    name,
    school: ((body.school as string) || '').trim(),
    grade: (body.grade as string) || '',
    year: Number(body.year) || 0,
    sphone,
    pphone,
    address: (body.address as string) || '',
    specialty: (body.specialty as string) || '',
    memo: (body.memo as string) || '',
  };

  if (!name) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
  }

  // 같은 학생이 이미 있는지 이름 + 연락처로 확인한다(학교·학년은 진학으로 바뀌므로 제외).
  // 검사는 서버에서 한다 — 화면에서만 막으면 중복 클릭이나 직접 호출로 계속 중복 행이 생긴다.
  const matches = await selectStudentsByNameAndPhone(name, sphone, pphone);
  const active = matches.filter((m) => Number(m.status) === 1);
  const exited = matches.filter((m) => Number(m.status) === 0);

  // 재원생 중복은 어떤 경우에도 새로 만들지 않는다. 기존 학생으로 안내한다.
  if (active.length > 0) {
    return NextResponse.json({ code: 'active', students: active }, { status: 409 });
  }

  // 퇴원생이 있으면 관리자에게 재원 처리할지 물어본다.
  // force=true 는 관리자가 확인 화면에서 "신규 입력"을 고른 경우다(동명이인 등).
  if (exited.length > 0 && !body.force) {
    return NextResponse.json({ code: 'exited', students: exited }, { status: 409 });
  }

  const studentId = await withTransaction(async () => {
    const sid = await insertStudent(student);
    await insertStudentAnalysis(sid, 'join');
    return sid;
  });

  return NextResponse.json({ id: studentId });
});
