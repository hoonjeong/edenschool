import { NextRequest, NextResponse } from 'next/server';
import {
  sendSms,
  isSmsSuccess,
  smsFailureReason,
  MMS_MAX_IMAGES,
  MMS_MAX_IMAGE_BYTES,
  MMS_ALLOWED_MIME,
  type SmsImage,
} from '@edenschool/common/sms';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { selectAcaPhoneByTeacherId } from '@edenschool/common/queries/admin-user';
import { selectSendHistoryByPhone, selectRecentSendHistory } from '@edenschool/common/queries/sms-log';

// GET: 발송 이력 조회 (발송자 구분 없이 전체 이력)
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const allHistory = searchParams.get('allHistory');

  // 전체 최근 발송 이력: ?allHistory=true
  if (allHistory === 'true') {
    const rows = await selectRecentSendHistory(30);
    return NextResponse.json({ history: rows });
  }

  if (!phone) {
    return NextResponse.json({ history: [] });
  }

  // 특정 번호의 발송 이력
  const rows = await selectSendHistoryByPhone(phone, 30);
  return NextResponse.json({ history: rows });
});

// POST: Send SMS / LMS / MMS
// - application/json: { numbers, message, type }
// - multipart/form-data (MMS): numbers(JSON 문자열), message, type, images(파일, 최대 3장)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  let numbers: unknown;
  let message: string;
  let type: string | undefined;
  const images: SmsImage[] = [];

  if (req.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await req.formData();
    try {
      numbers = JSON.parse(String(form.get('numbers') || '[]'));
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid numbers' }, { status: 400 });
    }
    message = String(form.get('message') || '');
    type = String(form.get('type') || '') || undefined;

    const files = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MMS_MAX_IMAGES) {
      return NextResponse.json({ ok: false, error: `이미지는 최대 ${MMS_MAX_IMAGES}장까지 첨부할 수 있습니다.` }, { status: 400 });
    }
    for (const f of files) {
      if (!MMS_ALLOWED_MIME.includes(f.type)) {
        return NextResponse.json({ ok: false, error: 'JPG, PNG, GIF 이미지만 첨부할 수 있습니다.' }, { status: 400 });
      }
      if (f.size > MMS_MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { ok: false, error: `이미지 용량은 장당 ${Math.floor(MMS_MAX_IMAGE_BYTES / 1024)}KB 이하여야 합니다.` },
          { status: 400 }
        );
      }
      images.push({ buffer: Buffer.from(await f.arrayBuffer()), filename: f.name || 'image.jpg', mimeType: f.type });
    }
  } else {
    const body = await req.json();
    numbers = body.numbers;
    message = body.message;
    type = body.type;
  }

  if (!numbers || !Array.isArray(numbers) || numbers.length === 0 || !message) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  if (numbers.length > 100) {
    return NextResponse.json({ ok: false, error: '한 번에 최대 100명까지 발송 가능합니다.' }, { status: 400 });
  }

  const smsType = type === 'MMS' ? 'MMS' : type || 'SMS';
  if (smsType === 'MMS' && images.length === 0) {
    return NextResponse.json({ ok: false, error: '이미지 문자(MMS)는 이미지를 1장 이상 첨부해야 합니다.' }, { status: 400 });
  }

  // Get the academy phone number for this teacher
  let srcNum = process.env.SMS_DEFAULT_CALLNUM;
  if (!srcNum) {
    return NextResponse.json({ ok: false, error: 'SMS_DEFAULT_CALLNUM not configured' }, { status: 500 });
  }

  try {
    const acaPhone = await selectAcaPhoneByTeacherId(session.user.id);
    if (acaPhone) {
      srcNum = acaPhone;
    }
  } catch {
    // use default srcNum
  }

  const results: { phone: string; success: boolean; reason?: string }[] = [];

  for (const phone of numbers) {
    if (!phone) continue;
    const result = await sendSms(smsType, phone, message, srcNum, session.user.id, { images });
    const success = isSmsSuccess(result);
    results.push(success ? { phone, success } : { phone, success, reason: smsFailureReason(result) });
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  if (failed > 0) {
    // 발신번호 미등록처럼 전량 실패하는 경우가 있어 서버 로그에도 남긴다.
    console.error(`SMS 발송 실패 ${failed}/${results.length}건 (발신번호 ${srcNum}):`, results.find((r) => !r.success)?.reason);
  }

  return NextResponse.json({
    ok: failed === 0,
    count: results.length,
    sent,
    failed,
    callNum: srcNum,
    // 실패 사유는 같은 원인인 경우가 대부분이라 대표 1건만 돌려준다.
    failReason: results.find((r) => !r.success)?.reason,
    results,
  });
});
