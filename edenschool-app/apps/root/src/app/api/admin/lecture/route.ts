import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectClassIdByName } from '@edenschool/common/queries/class';
import { insertLecture } from '@edenschool/common/queries/lecture';
import { insertFileStatus } from '@edenschool/common/queries/file';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const body = await req.json();
    const subject = body.subject as string;
    const description = body.description as string || '';
    const url = body.url as string || '';
    const code = body.code as string || '';
    const teacher = body.teacher as string;
    const classNames = (body.classes || []) as string[];
    const lectureDate = body.date as string || '';
    const fileIds = (body.fileIds || []) as (string | number)[];

    // Java original: creates ONE lecture per class_name (loops over classNames),
    // and attaches file_status to each created lecture.
    // If no classNames, creates a single lecture with classId=null (special lecture).
    let lastLectureId = 0;

    const insertLectureWithFiles = async (classId: number | null) => {
      const lectureId = await insertLecture({ subject, description, url, teacher, code, classId: classId || 0, lectureDate });
      lastLectureId = lectureId;

      // Create file_status records for this lecture
      for (const fileId of fileIds) {
        if (!fileId) continue;
        await insertFileStatus(lectureId, Number(fileId));
      }
    };

    if (classNames.length > 0 && classNames.some(n => n)) {
      for (const className of classNames) {
        let classId: number | null = null;
        if (className) {
          const id = await selectClassIdByName(className);
          if (id !== -1) {
            classId = id;
          }
        }
        await insertLectureWithFiles(classId);
      }
    } else {
      // No class names - special lecture (classId=null)
      await insertLectureWithFiles(null);
    }

    return NextResponse.json({ success: true, id: lastLectureId });
  } catch (error) {
    console.error('Insert lecture error:', error);
    return NextResponse.json({ error: 'Failed to insert lecture' }, { status: 500 });
  }
});
