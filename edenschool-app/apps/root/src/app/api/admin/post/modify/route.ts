import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { updatePost } from '@edenschool/common/queries/post';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const subject = formData.get('subject') as string;
    const contents = formData.get('contents') as string;
    const code = formData.get('code') as string;
    const category = formData.get('category') as string;
    const keyword = formData.get('keyword') as string;
    const description = formData.get('description') as string;

    if (!id) {
      return NextResponse.redirect(buildUrl('/admin/post?error=1', req));
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
