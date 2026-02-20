import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { insertQuestion } from '@edenschool/common/queries/question';
import { selectSpecialLectureModifyById } from '@edenschool/common/queries/lecture';
import { sendSms } from '@edenschool/common/sms';

const NOTIFY_PHONE = '010-9363-6362';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { text, lectureId } = await req.json();
  const id = await insertQuestion(text, session.user.id, lectureId);

  // 질문 등록 시 SMS 알림 발송
  try {
    const lecture = await selectSpecialLectureModifyById(Number(lectureId));
    if (lecture) {
      const teacher = lecture.teacher || '담당';
      const lectureDate = lecture.lectureDate || '';
      const msg = `${teacher} 선생님 ${lectureDate} 영상에 질문댓글이 달렸습니다. 확인해주세요.`;
      await sendSms('SMS', NOTIFY_PHONE, msg);
    }
  } catch (e) {
    console.error('질문 알림 SMS 발송 실패:', e);
  }

  return NextResponse.json({ success: true, id });
});
