import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { insertFileInfoName } from '@edenschool/common/queries/file';
import { validateUploadedFile } from '@/lib/upload-validation';
import { saveUploadFile } from '@/lib/legacy-upload';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validationError = await validateUploadedFile(file);
    if (validationError) return validationError;

    const buffer = Buffer.from(await file.arrayBuffer());
    // 레거시와 동일하게 파일시스템(upload/)에 저장하고 DB에는 파일명만 기록.
    const savedName = await saveUploadFile(file.name, buffer);
    const fileId = await insertFileInfoName(savedName);

    return NextResponse.json({
      fileId,
      fileName: savedName,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
});
