import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { selectStudentByPhone, insertUser } from '@edenschool/common/queries/user';
import { hashPassword } from '@edenschool/common/password';
import { isValidEmail, isValidPassword } from '@edenschool/common/validation';
import { sessionOptions } from '@edenschool/common/auth';
import type { SessionData } from '@edenschool/common/auth';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = formData.get('email') as string;
  const pw = formData.get('pw') as string;
  const sphone = (formData.get('sphone') as string) || '';
  const pphone = (formData.get('pphone') as string) || '';

  if (!email || !pw || !isValidEmail(email) || !isValidPassword(pw)) {
    return NextResponse.redirect(new URL('/join?error=1', req.url));
  }

  // Find student by phone numbers
  const student = await selectStudentByPhone(sphone, pphone);
  if (!student) {
    return NextResponse.redirect(new URL('/join?error=1', req.url));
  }

  const hashedPw = await hashPassword(pw);
  const userId = await insertUser(email, hashedPw, sphone, pphone, 'S', student.id);

  const response = NextResponse.redirect(new URL('/', req.url));
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
