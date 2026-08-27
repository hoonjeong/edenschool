import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireOwnerApiSession } from '@/lib/admin-session';
import { updateStudentStatus, modifyStudent } from '@edenschool/common/queries/student';
import { updateUserStatus } from '@edenschool/common/queries/user';
import { insertStudentAnalysis } from '@edenschool/common/queries/admin-user';
import { normalizePhone } from '@edenschool/common/validation';
import { withTransaction } from '@edenschool/common/db';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  const body = await req.json();
  const id = Number(body.id);

  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing student id' }, { status: 400 });
  }

  // student가 함께 오면 그 값으로 학생 정보도 갱신한다(신규 등록 화면에서 재원 처리한 경우).
  // 퇴원생 목록의 재원 버튼은 id만 보내므로 기존 정보를 그대로 둔다.
  const update = body.student as Record<string, unknown> | undefined;
  // 이름이 비어 오면 갱신하지 않는다 — 잘못된 호출로 기존 학생 정보가 지워지지 않도록.
  const name = String(update?.name ?? '').trim();

  await withTransaction(async () => {
    if (update && name) {
      await modifyStudent({
        id,
        name,
        school: String(update.school ?? '').trim(),
        grade: String(update.grade ?? ''),
        year: Number(update.year) || 0,
        sphone: normalizePhone(String(update.sphone ?? '')),
        pphone: normalizePhone(String(update.pphone ?? '')),
        address: String(update.address ?? ''),
        specialty: String(update.specialty ?? ''),
        memo: String(update.memo ?? ''),
      });
    }
    // 1. 학생을 재원 상태로
    await updateStudentStatus(id, 1);
    // 2. user_info 계정도 다시 사용 가능하게
    await updateUserStatus(id, 'S');
    // 3. 통계용 이력 기록
    await insertStudentAnalysis(id, 'rejoin');
  });

  return NextResponse.json({ success: true });
});
