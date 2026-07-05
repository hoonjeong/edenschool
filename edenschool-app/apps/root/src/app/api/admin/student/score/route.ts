import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import {
  selectStudentScores,
  insertStudentScore,
  updateStudentScore,
  deleteStudentScore,
} from '@edenschool/common/queries/student-record';

type Category = 'naesin' | 'mock';

function parseCategory(value: string | null): Category | null {
  return value === 'naesin' || value === 'mock' ? value : null;
}

// 숫자 파싱: 빈값/무효 → null
function toNum(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// 성적 목록
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const category = parseCategory(searchParams.get('category'));

  if (!studentId || !category) {
    return NextResponse.json({ error: 'studentId, category가 필요합니다.' }, { status: 400 });
  }

  const scores = await selectStudentScores(Number(studentId), category);
  return NextResponse.json({ scores });
});

// 성적 추가
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const body = await req.json();
  const studentId = Number(body.studentId);
  const category = parseCategory(body.category);
  const testName = (body.testName as string || '').trim();

  if (!studentId || !category || !testName) {
    return NextResponse.json({ error: '시험명을 입력하세요.' }, { status: 400 });
  }

  const id = await insertStudentScore(
    studentId,
    category,
    testName,
    toNum(body.rawScore),
    toNum(body.gradeRank),
    (body.memo as string) || ''
  );
  return NextResponse.json({ ok: true, id });
});

// 성적 수정
export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const body = await req.json();
  const id = Number(body.id);
  const testName = (body.testName as string || '').trim();

  if (!id || !testName) {
    return NextResponse.json({ error: '시험명을 입력하세요.' }, { status: 400 });
  }

  await updateStudentScore(
    id,
    testName,
    toNum(body.rawScore),
    toNum(body.gradeRank),
    (body.memo as string) || ''
  );
  return NextResponse.json({ ok: true });
});

// 성적 삭제
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  await deleteStudentScore(Number(id));
  return NextResponse.json({ ok: true });
});
