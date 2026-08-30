import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectPostById, insertPost, updatePost } from '@edenschool/common/queries/post';
import { selectPostFileInfoListById, insertPostFileStatus } from '@edenschool/common/queries/file';
import { sanitizeAdminHtml } from '@/lib/sanitize';
import { toId } from '@/lib/params';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const id = toId(searchParams.get('id'));

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const post = await selectPostById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get attached files
    const files = await selectPostFileInfoListById(id);

    return NextResponse.json({ post, files });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const formData = await req.formData();
    const id = formData.get('id') as string | null;
    const subject = formData.get('subject') as string;
    const contents = sanitizeAdminHtml(formData.get('contents') as string || '');
    const code = formData.get('code') as string;
    const category = formData.get('category') as string;
    const keyword = formData.get('keyword') as string;
    const description = formData.get('description') as string;
    const fileIds = formData.getAll('file_id[]') as string[];

    if (id) {
      // 선생님은 본인 게시글만 수정 가능
      if (session.user.code !== 'O') {
        const existing = await selectPostById(Number(id));
        if (!existing || existing.userId !== session.user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      // Update existing post (edit mode)
      await updatePost({
        id: Number(id),
        subject,
        contents,
        code,
        category,
        metaKeyword: keyword,
        metaDescription: description,
      });

      // Create new post_file_status records for newly attached files
      for (const fileId of fileIds) {
        if (!fileId) continue;
        await insertPostFileStatus(Number(id), Number(fileId));
      }

      return NextResponse.json({ ok: true, id: Number(id) });
    } else {
      // Insert new post
      const postId = await insertPost({
        subject,
        contents,
        code,
        userId: session.user.id,
        category,
        metaKeyword: keyword,
        metaDescription: description,
      });

      // Create post_file_status records
      for (const fileId of fileIds) {
        if (!fileId) continue;
        await insertPostFileStatus(postId, Number(fileId));
      }

      return NextResponse.json({ ok: true, id: postId });
    }
  } catch (error) {
    console.error('Create/update post error:', error);
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
  }
});
