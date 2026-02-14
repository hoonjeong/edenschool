import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectSpecialLectureModifyById } from '@edenschool/common/queries/lecture';
import { selectFileInfoListById } from '@edenschool/common/queries/file';

// Matches original: selectSpecialLectureModifyById + selectFileInfoListById
// Used by lecture-modify page to fetch lecture data for editing
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing lecture id' }, { status: 400 });
  }

  try {
    // selectSpecialLectureModifyById: get lecture with class_name via LEFT JOIN
    const lecture = await selectSpecialLectureModifyById(Number(id));

    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    // selectFileInfoListById: get attached files
    const files = await selectFileInfoListById(Number(id));

    return NextResponse.json({ lecture, files });
  } catch (error) {
    console.error('Get lecture detail error:', error);
    return NextResponse.json({ error: 'Failed to get lecture detail' }, { status: 500 });
  }
});
