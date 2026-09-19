import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { parseSmsExcel } from '@/lib/sms-excel';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// POST (multipart, file): 엑셀에서 발송 대상 번호를 추출해 돌려준다. 발송은 하지 않는다.
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: '파일이 첨부되지 않았습니다.' }, { status: 400 });
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return NextResponse.json({ error: '.xlsx 엑셀 파일만 업로드할 수 있습니다.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: '엑셀 파일은 5MB 이하만 업로드할 수 있습니다.' }, { status: 400 });
  }

  try {
    const result = await parseSmsExcel(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : '엑셀을 읽는 중 오류가 발생했습니다.';
    return NextResponse.json({ error: `엑셀을 읽을 수 없습니다: ${message}` }, { status: 400 });
  }
});
