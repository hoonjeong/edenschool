import { NextRequest, NextResponse } from 'next/server';

/** 학과 검색 결과에서 고른 학과를 비교 화면의 a 또는 b 자리로 보낸다. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ seq: string }> }) {
  const { seq } = await params;
  const a = req.nextUrl.searchParams.get('a');
  const target = new URL('/career/compare', req.nextUrl.origin);
  if (a && /^\d+$/.test(a) && a !== seq) {
    target.searchParams.set('a', a);
    target.searchParams.set('b', seq);
  } else {
    target.searchParams.set('a', seq);
  }
  return NextResponse.redirect(target);
}
