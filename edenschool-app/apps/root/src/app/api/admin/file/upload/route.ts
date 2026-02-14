import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { insertFileInfo } from '@edenschool/common/queries/file';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save file data to file_info table as BLOB
    const fileId = await insertFileInfo(fileName, buffer);

    return NextResponse.json({
      fileId,
      fileName: fileName,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
});
