import { NextResponse } from 'next/server';
import { selectActivePopup } from '@edenschool/common/queries/site-config';

export async function GET() {
  const popup = await selectActivePopup();
  if (!popup || !popup.image_file_id) {
    return NextResponse.json({ popup: null });
  }
  return NextResponse.json({ popup });
}
