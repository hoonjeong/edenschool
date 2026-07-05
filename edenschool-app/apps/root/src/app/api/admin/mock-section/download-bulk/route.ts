import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectMockSectionContentsByMetaIds } from '@edenschool/common/queries/mock-test';
import JSZip from 'jszip';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const body = await req.json();
  const ids: number[] = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids는 비어있지 않은 배열이어야 합니다.' }, { status: 400 });
  }
  if (ids.length > 50) {
    return NextResponse.json({ error: '한 번에 최대 50개까지 다운로드 가능합니다.' }, { status: 400 });
  }

  const files = await selectMockSectionContentsByMetaIds(ids);
  if (files.length === 0) return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });

  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (const file of files) {
    if (!file.content || !file.fileName) continue;
    let name = file.fileName;
    if (usedNames.has(name)) {
      const dot = name.lastIndexOf('.');
      const base = dot > 0 ? name.substring(0, dot) : name;
      const extStr = dot > 0 ? name.substring(dot) : '';
      let counter = 1;
      while (usedNames.has(name)) { name = `${base}(${counter})${extStr}`; counter++; }
    }
    usedNames.add(name);
    zip.file(name, file.content);
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('영역별모의고사_일괄다운.zip')}`,
      'Content-Length': String(zipBuffer.length),
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
