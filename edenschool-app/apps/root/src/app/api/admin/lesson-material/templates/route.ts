import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { parseTemplate } from '@/lib/lesson-material/template';
import { listTemplates, createTemplate } from '@/lib/lesson-material/queries';
import { lessonMaterialConfig } from '@/lib/lesson-material/config';

/** 목록 */
export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();
  return NextResponse.json(await listTemplates());
});

/** 등록 (multipart: files) */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  const formData = await req.formData();
  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: 'HTML 파일을 첨부하세요.' }, { status: 400 });
  }

  const created: { id: number; name: string; title: string; hasPaper: boolean }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const f of files) {
    const name = f.name;
    if (!/\.html?$/i.test(name)) {
      skipped.push({ name, reason: 'HTML 파일만 등록할 수 있습니다.' });
      continue;
    }
    if (f.size > lessonMaterialConfig.maxUploadBytes) {
      const mb = Math.round(lessonMaterialConfig.maxUploadBytes / 1024 / 1024);
      skipped.push({ name, reason: `파일이 너무 큽니다. 최대 ${mb}MB.` });
      continue;
    }
    try {
      const html = Buffer.from(await f.arrayBuffer()).toString('utf8');
      const p = parseTemplate(html, name);
      const id = await createTemplate({
        name,
        title: p.title,
        html,
        css: p.css,
        skeleton: p.skeleton,
        guide: p.guide || null,
        hasPaper: p.hasPaper,
        byteSize: f.size,
        adminId: session.user.id,
        adminName: session.user.name,
      });
      created.push({ id, name, title: p.title, hasPaper: p.hasPaper });
    } catch (e) {
      skipped.push({ name, reason: e instanceof Error ? e.message : '등록 실패' });
    }
  }

  return NextResponse.json({ created, skipped });
});
