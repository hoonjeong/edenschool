import { NextRequest, NextResponse } from 'next/server';
import { sendSms } from '@edenschool/common/sms';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { selectAcaPhoneByTeacherId } from '@edenschool/common/queries/admin-user';
import { selectSendHistory, selectSendHistoryBatch, selectSendHistoryBySenderId } from '@edenschool/common/queries/sms-log';

// GET: Fetch send history for a phone number
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const phones = searchParams.get('phones');
  const myHistory = searchParams.get('myHistory');

  // My send history: ?myHistory=true
  if (myHistory === 'true') {
    const rows = await selectSendHistoryBySenderId(session.user.id, 30);
    return NextResponse.json({ history: rows });
  }

  // Batch mode: ?phones=010...,010...
  if (phones) {
    const phoneList = phones.split(',').map((p) => p.trim()).filter(Boolean);
    if (phoneList.length === 0) return NextResponse.json({ history: [] });
    const rows = await selectSendHistoryBatch(phoneList);
    return NextResponse.json({ history: rows });
  }

  if (!phone) {
    return NextResponse.json({ history: [] });
  }

  const rows = await selectSendHistory(phone);
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
