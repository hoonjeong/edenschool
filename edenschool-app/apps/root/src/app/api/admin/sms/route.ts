import { NextRequest, NextResponse } from 'next/server';
import { sendSms } from '@edenschool/common/sms';
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

// POST: Send SMS
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  const body = await req.json();
  const { numbers, message, type } = body;

  if (!numbers || !Array.isArray(numbers) || numbers.length === 0 || !message) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  if (numbers.length > 100) {
    return NextResponse.json({ ok: false, error: '한 번에 최대 100명까지 발송 가능합니다.' }, { status: 400 });
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

  const smsType = type || 'SMS';
  const results: { phone: string; result: string | null }[] = [];

  for (const phone of numbers) {
    if (!phone) continue;
    const result = await sendSms(smsType, phone, message, srcNum, session.user.id);
    results.push({ phone, result });
  }

  return NextResponse.json({ ok: true, count: results.length, results });
});
