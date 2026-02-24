import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { selectStudentByPhone, insertUser } from '@edenschool/common/queries/user';
import { hashPassword } from '@edenschool/common/password';
import { isValidEmail, isValidPassword } from '@edenschool/common/validation';
import { sessionOptions } from '@edenschool/common/auth';
import type { SessionData } from '@edenschool/common/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'join', 5, 15 * 60 * 1000);
  if (limited) return limited;

  const formData = await req.formData();
  const email = formData.get('email') as string;
  const pw = formData.get('pw') as string;
  const sphone = (formData.get('sphone') as string) || '';
  const pphone = (formData.get('pphone') as string) || '';

  if (!email || !pw || !isValidEmail(email) || !isValidPassword(pw)) {
    return NextResponse.redirect(buildUrl('/join?error=1', req));
  }

  // Find student by phone numbers
  const student = await selectStudentByPhone(sphone, pphone);
  if (!student) {
    return NextResponse.redirect(buildUrl('/join?error=1', req));
  }

  const hashedPw = await hashPassword(pw);
  const userId = await insertUser(email, hashedPw, sphone, pphone, 'S', student.id);

  const response = NextResponse.redirect(buildUrl('/', req));
  const session = await getIronSession<SessionData>(req, response, sessionOptions);
  session.user = {
    id: userId,
    email,
    studentId: student.id,
    name: student.name,
    code: 'S',
  };
  await session.save();

  return response;
}
