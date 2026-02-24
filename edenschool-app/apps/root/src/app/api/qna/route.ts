import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { sanitizeUserHtml, stripHtml } from '@/lib/sanitize';
import {
  selectQnaPostForEdit,
  insertQnaPost,
  updateQnaPost,
  deleteQnaPost,
} from '@edenschool/common/queries/qna';

const MAX_SUBJECT_LENGTH = 200;
const MAX_CONTENTS_LENGTH = 50000;

function parsePositiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// 수정용 단건 조회 (인증 + 본인 확인 필수)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();
  const { searchParams } = new URL(req.url);
  const id = parsePositiveInt(searchParams.get('id'));
  if (!id) {
    return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 });
  }

  const post = await selectQnaPostForEdit(id);
  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: '본인 글만 조회할 수 있습니다.' }, { status: 403 });
  }

  return NextResponse.json({ post: { id: post.id, subject: post.subject, contents: post.contents } });
});

// 글 작성
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();
  const body = await req.json();
  const subject = String(body.subject ?? '').trim();
  const rawContents = String(body.contents ?? '').trim();

  if (!subject) {
    return NextResponse.json({ error: '제목을 입력하세요.' }, { status: 400 });
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json({ error: `제목은 ${MAX_SUBJECT_LENGTH}자 이내로 입력하세요.` }, { status: 400 });
  }
  if (!rawContents || rawContents === '<p><br></p>') {
    return NextResponse.json({ error: '내용을 입력하세요.' }, { status: 400 });
  }
  if (rawContents.length > MAX_CONTENTS_LENGTH) {
    return NextResponse.json({ error: '내용이 너무 깁니다.' }, { status: 400 });
  }

  const contents = sanitizeUserHtml(rawContents);
  const metaDescription = stripHtml(contents).slice(0, 150);

  const id = await insertQnaPost(subject, contents, session.user.id, metaDescription);
  return NextResponse.json({ success: true, id });
});

// 글 수정
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();
  const body = await req.json();
  const id = parsePositiveInt(body.id);
  const subject = String(body.subject ?? '').trim();
  const rawContents = String(body.contents ?? '').trim();

  if (!id) {
    return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ error: '제목을 입력하세요.' }, { status: 400 });
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return NextResponse.json({ error: `제목은 ${MAX_SUBJECT_LENGTH}자 이내로 입력하세요.` }, { status: 400 });
  }
  if (!rawContents || rawContents === '<p><br></p>') {
    return NextResponse.json({ error: '내용을 입력하세요.' }, { status: 400 });
  }
  if (rawContents.length > MAX_CONTENTS_LENGTH) {
    return NextResponse.json({ error: '내용이 너무 깁니다.' }, { status: 400 });
  }

  const post = await selectQnaPostForEdit(id);
  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: '본인 글만 수정할 수 있습니다.' }, { status: 403 });
  }

  const contents = sanitizeUserHtml(rawContents);
  const metaDescription = stripHtml(contents).slice(0, 150);

  await updateQnaPost(id, subject, contents, metaDescription);
  return NextResponse.json({ success: true });
});

// 글 삭제
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();
  const { searchParams } = new URL(req.url);
  const id = parsePositiveInt(searchParams.get('id'));

  if (!id) {
    return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 });
  }

  const post = await selectQnaPostForEdit(id);
  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: '본인 글만 삭제할 수 있습니다.' }, { status: 403 });
  }

  await deleteQnaPost(id);
  return NextResponse.json({ success: true });
});
