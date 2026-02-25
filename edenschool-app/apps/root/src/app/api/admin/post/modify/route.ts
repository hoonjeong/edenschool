import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { updatePost, selectPostById } from '@edenschool/common/queries/post';
import { sanitizeAdminHtml } from '@/lib/sanitize';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const subject = formData.get('subject') as string;
    const contents = sanitizeAdminHtml(formData.get('contents') as string || '');
    const code = formData.get('code') as string;
    const category = formData.get('category') as string;
    const keyword = formData.get('keyword') as string;
    const description = formData.get('description') as string;

    if (!id) {
      return NextResponse.redirect(buildUrl('/admin/post?error=1', req));
    }

    // 선생님은 본인 게시글만 수정 가능
    if (session.user.code !== 'O') {
      const existing = await selectPostById(Number(id));
      if (!existing || existing.userId !== session.user.id) {
        return NextResponse.redirect(buildUrl('/admin/post?error=1', req));
      }
    }

    // Java original: ActionModifyController - dao.updatePost(post)
    await updatePost({
      id: Number(id),
      subject,
      contents,
      code,
      category,
      metaKeyword: keyword,
      metaDescription: description,
    });

    return NextResponse.redirect(buildUrl(`/admin/post-view?id=${id}`, req));
  } catch (error) {
    console.error('Modify post error:', error);
    return NextResponse.redirect(buildUrl('/admin/post?error=1', req));
  }
});
