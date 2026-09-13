import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession, requireOwnerApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { validateUploadedFile } from '@/lib/upload-validation';
import {
  insertSplitFileMetaInfo,
  insertSplitFileContent,
  updateSplitFileMetaInfoById,
  deleteSplitFileMetaInfoById,
  deleteSplitFileContentByMetaId,
  selectSplitFileMetaInfoById,
  selectSplitFileContentByMetaId,
  searchSplitFiles,
} from '@edenschool/common/queries/split-file';
import { toId } from '@/lib/params';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const formData = await req.formData();
    const file = formData.get('formFile') as File | null;
    const grade = (formData.get('grade') as string) || '';
    const subject = (formData.get('subject') as string) || '';
    const publisher = (formData.get('publisher') as string) || '';
    const searchKeyword = (formData.get('search_keyword') as string) || '';
    const schoolName = (formData.get('school_name') as string) || '';
    const year = Number(formData.get('year')) || 0;
    const term = Number(formData.get('term')) || 0;
    const testType = Number(formData.get('test_type')) || 0;
    const fileType = (formData.get('fileType') as string) || 'HWP';

    const metaId = await insertSplitFileMetaInfo({
      grade,
      subject,
      publisher,
      searchKeyword,
      schoolName,
      year,
      term,
      testType,
      fileType,
    });

    if (file) {
      const validationError = await validateUploadedFile(file);
      if (validationError) return validationError;
      const buffer = Buffer.from(await file.arrayBuffer());
      await insertSplitFileContent(metaId, buffer, file.name);
    }

    return NextResponse.json({ ok: true, id: metaId });
  } catch (error) {
    console.error('Insert split file error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to insert split file' }, { status: 500 });
  }
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const { searchParams } = new URL(req.url);
    const metaIdParam = searchParams.get('metaId');
    const metaId = toId(metaIdParam);
    if (metaIdParam && !metaId) {
      return NextResponse.json({ error: 'Invalid metaId' }, { status: 400 });
    }

    if (metaId) {
      const meta = await selectSplitFileMetaInfoById(metaId);
      const fileInfo = await selectSplitFileContentByMetaId(metaId);
      return NextResponse.json({
        meta: meta || null,
        file: fileInfo ? { id: fileInfo.id, fileName: fileInfo.fileName } : null,
      });
    }

    // Search mode
    const keyword = (searchParams.get('keyword') || '').slice(0, 100);
    const grade = searchParams.get('grade')?.split(',').filter(Boolean).slice(0, 10) || [];
    const subject = searchParams.get('subject')?.split(',').filter(Boolean).slice(0, 10) || [];
    const publisher = searchParams.get('publisher')?.split(',').filter(Boolean).slice(0, 10) || [];
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 50));

    const result = await searchSplitFiles({ keyword, grade, subject, publisher, page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get split file error:', error);
    return NextResponse.json({ list: [], total: 0 }, { status: 500 });
  }
});

// PUT: 쪼개기 메타 정보 수정 (+ 파일 교체). 관리 메뉴 전용 — 원장(O)만 가능
export const PUT = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  try {
    const formData = await req.formData();
    const metaId = toId(formData.get('metaId') as string | null);
    if (!metaId) {
      return NextResponse.json({ ok: false, error: 'Missing metaId' }, { status: 400 });
    }
    const existing = await selectSplitFileMetaInfoById(metaId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: '쪼개기 파일 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const file = formData.get('formFile') as File | null;
    const hasFile = !!file && file.size > 0;

    await updateSplitFileMetaInfoById(metaId, {
      grade: (formData.get('grade') as string) || '',
      subject: (formData.get('subject') as string) || '',
      publisher: (formData.get('publisher') as string) || '',
      searchKeyword: (formData.get('search_keyword') as string) || '',
      schoolName: (formData.get('school_name') as string) || '',
      year: Number(formData.get('year')) || 0,
      term: Number(formData.get('term')) || 0,
      testType: Number(formData.get('test_type')) || 0,
      // 새 파일이 없으면 기존 file_type 유지
      fileType: hasFile ? ((formData.get('fileType') as string) || 'HWP') : existing.fileType || 'HWP',
    });

    // 새 파일이 올라오면 기존 파일을 교체한다
    if (hasFile) {
      const validationError = await validateUploadedFile(file);
      if (validationError) return validationError;
      const buffer = Buffer.from(await file.arrayBuffer());
      await deleteSplitFileContentByMetaId(metaId);
      await insertSplitFileContent(metaId, buffer, file.name);
    }

    return NextResponse.json({ ok: true, id: metaId });
  } catch (error) {
    console.error('Update split file error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update split file' }, { status: 500 });
  }
});

// DELETE: 쪼개기 메타 + 파일 삭제. 관리 메뉴 전용 — 원장(O)만 가능
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  try {
    const { searchParams } = new URL(req.url);
    const id = toId(searchParams.get('id'));

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }

    await deleteSplitFileContentByMetaId(id);
    await deleteSplitFileMetaInfoById(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete split file error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete split file' }, { status: 500 });
  }
});
