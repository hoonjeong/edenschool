import { NextResponse } from 'next/server';
import { selectClassDisplayListActive } from '@edenschool/common/queries/site-config';

export async function GET() {
  const list = await selectClassDisplayListActive();
  return NextResponse.json({ list });
}
