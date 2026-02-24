import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { insertFileInfo } from '@edenschool/common/queries/file';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = ['.pdf', '.hwp', '.hwpx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.doc', '.docx', '.xls', '.xlsx'];

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `허용되지 않는 파일 형식입니다. (${ALLOWED_EXTENSIONS.join(', ')})` }, { status: 400 });
    }

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
