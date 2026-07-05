import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { validateUploadedFile } from '@/lib/upload-validation';
import { insertMockFullMeta, insertMockFullContent, deleteMockFullMetaById } from '@edenschool/common/queries/mock-test';

// 풀세트 모의고사 추가
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const formData = await req.formData();
  const file = formData.get('formFile') as File | null;
  const grade = (formData.get('grade') as string) || '';
  const year = Number(formData.get('year')) || 0;
  const month = Number(formData.get('month')) || 0;
  const fileType = (formData.get('fileType') as string) || 'HWP';

  if (!grade) return NextResponse.json({ error: '학년을 선택하세요.' }, { status: 400 });

  const metaId = await insertMockFullMeta({ grade, year, month, fileType });

  if (file) {
    const validationError = await validateUploadedFile(file);
    if (validationError) return validationError;
    const buffer = Buffer.from(await file.arrayBuffer());
    await insertMockFullContent(metaId, buffer, file.name);
  }

  return NextResponse.json({ ok: true, id: metaId });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteMockFullMetaById(Number(id));
  return NextResponse.json({ ok: true });
});
