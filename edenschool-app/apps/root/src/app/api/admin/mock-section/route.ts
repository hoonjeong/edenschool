import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { validateUploadedFile } from '@/lib/upload-validation';
import { insertMockSectionMeta, insertMockSectionContent, deleteMockSectionMetaById } from '@edenschool/common/queries/mock-test';

// 영역별 모의고사 추가
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const formData = await req.formData();
  const file = formData.get('formFile') as File | null;
  const area = (formData.get('area') as string) || '';
  const subArea = (formData.get('sub_area') as string) || '';
  const grade = (formData.get('grade') as string) || '';
  const year = Number(formData.get('year')) || 0;
  const month = Number(formData.get('month')) || 0;
  const searchKeyword = (formData.get('search_keyword') as string) || '';
  const fileType = (formData.get('fileType') as string) || 'HWP';

  if (!area) return NextResponse.json({ error: '영역을 선택하세요.' }, { status: 400 });

  const metaId = await insertMockSectionMeta({ area, subArea, grade, year, month, searchKeyword, fileType });

  if (file) {
    const validationError = await validateUploadedFile(file);
    if (validationError) return validationError;
    const buffer = Buffer.from(await file.arrayBuffer());
    await insertMockSectionContent(metaId, buffer, file.name);
  }

  return NextResponse.json({ ok: true, id: metaId });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteMockSectionMetaById(Number(id));
  return NextResponse.json({ ok: true });
});
