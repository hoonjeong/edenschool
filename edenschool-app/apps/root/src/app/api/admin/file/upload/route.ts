import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { insertFileInfo } from '@edenschool/common/queries/file';
import { validateUploadedFile } from '@/lib/upload-validation';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validationError = validateUploadedFile(file);
    if (validationError) return validationError;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = await insertFileInfo(file.name, buffer);

    return NextResponse.json({
      fileId,
      fileName: file.name,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
});
