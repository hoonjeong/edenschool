import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectClassIdByName } from '@edenschool/common/queries/class';
import { modifyLecture, selectLectureTeacherById } from '@edenschool/common/queries/lecture';
import { insertFileStatus } from '@edenschool/common/queries/file';

// Matches original: ActionModifyLectureController -> modifyLecture + insertFileStatus
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const body = await req.json();
    const { id, subject, description, url, teacher, classes, fileIds, date } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing lecture id' }, { status: 400 });
    }

    // 선생님은 본인 강의만 수정 가능
    if (session.user.code !== 'O') {
      const currentTeacher = await selectLectureTeacherById(Number(id));
      if (currentTeacher !== session.user.name) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    // Original: selectClassIdByName - resolve class_id from first class name
    let classId: number | null = null;
    const classNames = classes as string[] || [];
    if (classNames.length > 0 && classNames[0]) {
      const resolvedId = await selectClassIdByName(classNames[0]);
      if (resolvedId !== -1) {
        classId = resolvedId;
      }
    }

    // Original: modifyLecture
    await modifyLecture({
      id,
      subject: subject || '',
      description: description || '',
      url: url || '',
      teacher: teacher || '',
      code: '',
      classId: classId || 0,
      lectureDate: date || '',
    });

    // Original: insertFileStatus for new files
    if (fileIds && Array.isArray(fileIds)) {
      for (const fileId of fileIds) {
        if (!fileId) continue;
        // insertFileStatus handles the insert; duplicates would cause a DB error
        // so we rely on the caller to only send new file IDs
        await insertFileStatus(Number(id), Number(fileId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Modify lecture error:', error);
    return NextResponse.json({ success: false, error: 'Failed to modify lecture' }, { status: 500 });
  }
});
